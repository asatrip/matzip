const bcrypt = require('bcrypt');
const Class = require('./class');
const User = require('./user');
const Board = require('./board');
const Article = require('./article');
const Point = require('./point');
const Alarm = require('./alarm');
const pagination = require('../middleware/pagination');
const datetime = require('../middleware/datetime');
const config = require('../middleware/config');
const cache = require('./cache');

const SALT_COUNT = 10;

const s3 = config.getStorage();

class Comment extends Class {
  async getCommentsByPagination (data) {
    data = Object.assign({
      searchType: null,
      keyword: null,
      userId: null,
      anonymous: true,
    }, data);
    const {
      searchType,
      keyword,
      userId,
      anonymous,
    } = data;
    let queryString = '';
    const queryArray = [];
    if (userId) {
      queryString += `AND c.comment_user_ID = ?\n`;
      queryArray.push(userId);
    }
    if (searchType === 'nickName') {
      queryString += `AND u.nickName = ?\n`;
      queryArray.push(keyword);
    }
    if (!anonymous) {
      queryString += `AND b.useAnonymous != 1\n`;
    }
    const pnQuery = `SELECT count(*) AS count
    FROM comment AS c
    LEFT JOIN article AS a
    ON c.comment_article_ID = a.id
    LEFT JOIN board AS b
    ON a.article_board_ID = b.id
    LEFT JOIN user AS u
    ON c.comment_user_ID = u.id
    WHERE c.status = 1
    ${queryString}
    `;
    const [pnResult, ] = await this.conn.query(pnQuery, queryArray);
    const pn = pagination(pnResult, this.req.query, 'page', 10);
    const query = `SELECT c.*, b.slug AS boardSlug, a.id AS articleId, u.nickName AS nickName
    FROM comment AS c
    LEFT JOIN article AS a
    ON c.comment_article_ID = a.id
    LEFT JOIN board AS b
    ON a.article_board_ID = b.id
    LEFT JOIN user AS u
    ON c.comment_user_ID = u.id
    WHERE c.status = 1
    ${queryString}
    ORDER BY c.createdAt DESC
    ${pn.queryLimit}`;
    const [comments, ] = await this.conn.query(query, queryArray);
    comments.forEach(comment => {
      comment.datetime = datetime(comment.createdAt);
    });
    return {
      comments,
      pn,
    };
  }
  async getComments (articleId) {
    const query = `SELECT c.*, c.nickName AS nonMember, u.id AS userId, u.nickName AS nickName, u.permission AS permission, p.title AS permissionName, p.isAdmin AS authorIsAdmin, u.image AS userImage, b.useAnonymous
    FROM comment AS c
    LEFT JOIN user AS u
    ON c.comment_user_ID = u.id
    LEFT JOIN permission AS p
    ON u.permission = p.permission
    LEFT JOIN article AS a
    ON c.comment_article_ID = a.id
    LEFT JOIN board AS b
    ON a.article_board_ID = b.id
    WHERE c.comment_article_ID = ? AND c.status = 1`;
    const [commentRaws, ] = await this.conn.query(query, [articleId]);
    const comments = commentRaws.filter(commentRaw => commentRaw.comment_parent_ID === null);
    for await (let comment of comments) {
      comment = await this.setInfo(comment);
      const replies = commentRaws.filter(commentRaw => commentRaw.comment_group_ID === comment.id && commentRaw.id !== comment.id);
      for await (let reply of replies) {
        reply = await this.setInfo(reply);
        if (reply.comment_parent_ID !== reply.comment_group_ID) {
          const parenyReply = replies.find(r => r.id === reply.comment_parent_ID);
          reply.parentNickName = parenyReply.nickName;
        }
      }
      comment.replies = replies;
    }
    return comments;
  }
  async get (commentId) {
    const query = `SELECT c.*, u.nickName
    FROM comment AS c
    LEFT JOIN user AS u
    ON c.comment_user_ID = u.id
    WHERE c.id = ?`;
    const [comments, ] = await this.conn.query(query, [commentId]);
    if (comments.length) {
      const comment = comments[0];
      return comment;
    } else {
      return null;
    }
  }
  async create (articleId, data) {
    data = Object.assign({
      content: null,
      nickName: null,
      password: null,
    }, data);
    const { nickName, password } = data;
    let { content } = data;

    const articleClass = new Article(this.req, this.res, this.conn);
    const article = await articleClass.get({
      id: articleId,
    });
    const board = cache.boards.find(board => board.id === article.article_board_ID);

    const tagRegex = new RegExp(/<[^>]*>/g);
    content = content.replace(tagRegex, '');

    // 비회원
    let hash = null;
    if (nickName && password) {
      const salt = bcrypt.genSaltSync(SALT_COUNT);
      hash = bcrypt.hashSync(password, salt);
    }

    const query = `INSERT INTO comment
    (comment_user_ID, comment_article_ID, content, nickName, password)
    VALUES (?, ?, ?, ?, ?)`;

    const [result, ] = await this.conn.query(query, [this.user?.id, articleId, content, nickName, hash]);
    if (result.insertId) {
      await this.conn.query(`UPDATE comment SET comment_group_ID = ? WHERE id = ?`, [result.insertId, result.insertId]);
      await this.conn.query(`UPDATE article SET commentCount=commentCount+1, updatedAt=NOW() WHERE id = ?`, [articleId]);
      // 포인트
      if (this.user) {
        const pointClass = new Point(this.req, this.res, this.conn);
        const pointData = {
          user: this.user,
          type: 'createComment',
          point: board.commentPoint,
        };
        await pointClass.create(pointData);
      }
      // 알람
      const alarmClass = new Alarm(this.req, this.res, this.conn);
      const alarmData = {
        type: 'newComment',
        userId: article.article_user_ID,
        relatedUserId: this.user?.id,
        boardId: board.id,
        articleId: article.id,
      };
      await alarmClass.create(alarmData);
      return true;
    } else {
      return false;
    }
  }
  async reply (commentId, data) {
    data = Object.assign({
      content: null,
      nickName: null,
      password: null,
    }, data);
    let { content, nickName, password } = data;
    const comment = await this.get(commentId);

    const articleClass = new Article(this.req, this.res, this.conn);
    const article = await articleClass.get({
      id: comment.comment_article_ID,
    });
    const board = cache.boards.find(board => board.id === article.article_board_ID);

    const tagRegex = new RegExp(/<[^>]*>/g);
    content = content.replace(tagRegex, '');

    // 비회원
    let hash = null;
    if (nickName && password) {
      const salt = bcrypt.genSaltSync(SALT_COUNT);
      hash = bcrypt.hashSync(password, salt);
    }

    const insertQuery = `INSERT INTO comment
    (comment_user_ID, comment_article_ID, comment_parent_ID, comment_group_ID, content, nickName, password)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const [result, ] = await this.conn.query(insertQuery, [this.user?.id, comment.comment_article_ID, comment.id, comment.comment_group_ID, content, nickName, hash]);
    if (comment.id === comment.comment_group_ID) {
      await this.conn.query(`UPDATE comment SET replyCount = ? WHERE id = ?`, [comment.replyCount + 1, comment.id]);
    } else {
      await this.conn.query(`UPDATE comment SET replyCount = ? WHERE id = ?`, [comment.replyCount + 1, comment.id]);
      await this.conn.query(`UPDATE comment SET replyCount=replyCount+1 WHERE id = ?`, [comment.comment_group_ID]);
    }
    await this.conn.query(`UPDATE article SET commentCount = ?, updatedAt=NOW() WHERE id = ?`, [article.commentCount + 1, comment.comment_article_ID]);
    // 포인트
    
    if (this.user) {
      const pointClass = new Point(this.req, this.res, this.conn);
      const pointData = {
        user: this.user,
        type: 'createComment',
        point: board.commentPoint,
      };
      await pointClass.create(pointData);
    }
    // 알람
    const alarmClass = new Alarm(this.req, this.res, this.conn);
    const alarmData = {
      type: 'replyComment',
      userId: comment.comment_user_ID,
      relatedUserId: this.user?.id,
      boardId: board.id,
      articleId: article.id,
      commentId,
    };
    await alarmClass.create(alarmData);
    return true;
  }
  async update (commentId, data) {
    const comment = await this.get(commentId);
    data = Object.assign({
      content: comment.content,
      nickName: comment.nickName,
      password: null,
      reportCount: comment.reportCount,
      force: false,
    }, data);
    let { content, nickName, password, reportCount } = data;
    const { force } = data;
    const tagRegex = new RegExp(/<[^>]*>/g);
    content = content.replace(tagRegex, '');
    if (comment.comment_user_ID) {
      if (this.user?.id === comment.comment_user_ID || (this.user?.isManager && this.setting.useManagerArticle) || this.user?.isAdmin || force) {
        const query = `UPDATE comment SET content = ?, nickName = ?, reportCount = ? WHERE id = ?`;
        try {
          await this.conn.query(query, [content, nickName, reportCount, commentId]);
          return true;
        } catch (e) {
          throw new Error(e.message);
        }
      } else {
        throw new Error('권한이 없습니다');
      }
    } else {
      if (nickName, password) {
        const passwordCheck = bcrypt.compareSync(password, comment.password);
        if (passwordCheck) {
          const query = `UPDATE comment SET content = ?, nickName = ? WHERE id = ?`;
          const [result, ] = await this.conn.query(query, [content, nickName, commentId]);
          if (result.affectedRows) {
            return {
              status: true,
            };
          } else {
            throw new Error('댓글 수정에 실패하였습니다');
          }
        } else {
          throw new Error('비밀번호가 다릅니다');
        }
      } else {
        throw new Error('입력값이 부족합니다');
      }
    }
  }
  async remove (commentId, data) {
    const comment = await this.get(commentId);
    data = Object.assign({
      password: null,
    }, data);
    const { password } = data;

    // 비회원
    if (password) {
      const passwordCheck = bcrypt.compareSync(password, comment.password);
      if (!passwordCheck) {
        throw new Error('비밀번호가 다릅니다');
      }
    }

    const userClass = new User(this.req, this.res, this.conn);
    const articleClass = new Article(this.req, this.res, this.conn);
    const user = await userClass.get({ id: comment.comment_user_ID });
    const article = await articleClass.get({
      id: comment.comment_article_ID,
    });
    const board = cache.boards.find(board => board.id === article.article_board_ID);

    if (comment.comment_user_ID === this.user?.id || (this.user?.isManager && this.setting.useManagerArticle) || this.user?.isAdmin || !comment.comment_user_ID) {
      await this.conn.query(`UPDATE comment SET status=0 WHERE id = ?`, [commentId]);
      if (comment.comment_parent_ID && comment.comment_parent_ID === comment.comment_group_ID) {
        await this.conn.query(`UPDATE comment SET replyCount=replyCount-1 WHERE id = ?`, [comment.comment_parent_ID]);
      } else if (comment.comment_parent_ID && comment.comment_parent_ID !== comment.comment_group_ID) {
        await this.conn.query(`UPDATE comment SET replyCount=replyCount-1 WHERE id = ?`, [comment.comment_parent_ID]);
        await this.conn.query(`UPDATE comment SET replyCount=replyCount-1 WHERE id = ?`, [comment.comment_group_ID]);
      }
      await this.conn.query(`UPDATE article SET commentCount=commentCount-1, updatedAt=NOW() WHERE id = ?`, [comment.comment_article_ID]);
      
      // 포인트
      if (this.user) {
        const pointClass = new Point(this.req, this.res, this.conn);
        const pointData = {
          user,
          type: 'removeComment',
          point: board.commentPoint,
        };
        await pointClass.remove(pointData);
      }
      return {
        status: true,
      };
    } else {
      throw new Error('권한이 없습니다');
    }
  }
  async like (commentId) {
    const comment = await this.get(commentId);
    if (comment.comment_user_ID !== this.user.id) {
      const query = `SELECT *
      FROM userCommentLike
      WHERE userCommentLike_user_ID = ? AND userCommentLike_comment_ID = ?`;
      const [duplicateResult, ] = await this.conn.query(query, [this.user.id, commentId]);
      if (!duplicateResult.length) {
        await this.conn.query(`INSERT INTO userCommentLike (userCommentLike_user_ID, userCommentLike_comment_ID) VALUES (?, ?)`, [this.user.id, commentId]);
        await this.conn.query(`UPDATE comment SET likeCount=likeCount+1 WHERE id = ?`, [commentId]);
      } else {
        await this.conn.query(`DELETE FROM userCommentLike WHERE id = ?`, [duplicateResult[0].id]);
        await this.conn.query(`UPDATE comment SET likeCount=likeCount-1 WHERE id = ?`, [commentId]);
      }
      return {
        status: true,
      };
    } else {
      throw new Error(`자기 자신의 댓글은 추천할 수 없습니다`);
    }
  }
  async unlike (commentId) {
    const query = `SELECT *
    FROM userCommentUnlike
    WHERE userCommentUnlike_user_ID = ? AND userCommentUnlike_comment_ID = ?`;
    const [duplicateResult, ] = await this.conn.query(query, [this.user.id, commentId]);
    if (!duplicateResult.length) {
      await this.conn.query(`INSERT INTO userCommentUnlike (userCommentUnlike_user_ID, userCommentUnlike_comment_ID) VALUES (?, ?)`, [this.user.id, commentId]);
      await this.conn.query(`UPDATE comment SET unlikeCount=unlikeCount+1 WHERE id = ?`, [commentId]);
    } else {
      await this.conn.query(`DELETE FROM userCommentUnlike WHERE id = ?`, [duplicateResult[0].id]);
      await this.conn.query(`UPDATE comment SET unlikeCount=unlikeCount-1 WHERE id = ?`, [commentId]);
    }
    return true;
  }
  async setInfo (comment) {
    if (this.user?.id === comment.comment_user_ID) {
      comment.isAuthor = true;
    } else {
      comment.isAuthor = false;
    }
    
    // 회원 좋아요 확인
    if (this.user) {
      const [userLikeResult, ] = await this.conn.query(`SELECT * FROM userCommentLike WHERE userCommentLike_user_ID = ? AND userCommentLike_comment_ID = ?`, [this.user.id, comment.id]);
      const userLike = userLikeResult.length ? 1 : 0;
      comment.userLike = userLike;
    } else {
      comment.userLike = 0;
    }

    // comment.content = comment.content.replace(/\n/ig, '<br>');
    comment.contents = comment.content.split(/\n/ig);

    comment.datetime = datetime(comment.createdAt);
    // 댓글 상태
    if (!comment.status) comment.contents = ['삭제된 댓글 입니다.'];
    // 회원 이미지
    if (comment.userImage && (!comment.useAnonymous || comment.authorIsAdmin)) {
      comment.userImage = `${s3.host}/userImage/${comment.userImage}`;
    } else {
      comment.userImage = `/assets/userImage.svg`;
    }

    if (Number(comment.permissionName)) {
      comment.permissionName = `LV ${Number(comment.permissionName)}`;
    }

    // 비회원
    if (!comment.comment_user_ID) {
      comment.nickName = comment.nonMember;
      comment.permissionName = '비회원';
    }

    // 익명
    const isAnonymous = comment.useAnonymous && (comment.comment_user_ID !== this.user?.id && !this.user?.isAdmin) && !comment.authorIsAdmin;
    if (isAnonymous) {
      comment.nickName = '익명';
      comment.permissionName = null;
      comment.parentNickName = '익명';
    }

    // 등급 이미지
    const permissionImage = this.res.locals.permissions.find(permission => permission.permission === comment.permission);
    if (permissionImage?.image) {
      comment.permissionImage = `${s3.host}/permission/${permissionImage.image}`;
    } else {
      comment.permissionImage = `/assets/permission/${comment.permission}.svg`;
    }

    // 리포트
    if (comment.reportCount !== 0 && this.res.locals.setting.reportCount >= comment.reportCount && !this.user?.isAdmin) {
      comment.content = `관리자의 승인을 기다리는 댓글 입니다`;
    }

    return comment;
  }
  async getLikes (data) {
    data = Object.assign({
      userId: null,
    }, data);
    const { userId } = data;
    let queryString = '';
    const queryArray = [];
    if (userId) {
      queryString += `AND ul.userCommentLike_user_ID = ?\n`;
      queryArray.push(userId);
    }
    const pnQuery = `SELECT count(*) AS count
    FROM userCommentLike AS ul
    WHERE ul.status = 1
    ${queryString}`;
    const [pnResult, ] = await this.conn.query(pnQuery, queryArray);
    const pn = pagination(pnResult, this.req.query, 'page', 10);
    const query = `SELECT *, b.slug AS boardSlug, a.id AS articleId, c.content AS content, u.nickName
    FROM userCommentLike AS ul
    LEFT JOIN comment AS c
    ON ul.userCommentLike_comment_ID = c.id
    LEFT JOIN article AS a
    ON c.comment_article_ID = a.id
    LEFT JOIN board AS b
    ON a.article_board_ID = b.id
    LEFT JOIN user AS u
    ON c.comment_user_ID = u.id
    WHERE ul.status = 1
    ${queryString}
    ORDER BY ul.createdAt DESC
    ${pn.queryLimit}`;
    const [comments, ] = await this.conn.query(query, queryArray);
    comments.forEach(comment => {
      comment.datetime = datetime(comment.createdAt);
    });
    return {
      comments,
      pn,
    };
  }
}

module.exports = Comment;