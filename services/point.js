const { Parser } = require('json2csv');
const Permission = require('./permission');
const pagination = require('../middleware/pagination');
const datetime = require('../middleware/datetime');
const Class = require('./class');
const User = require('./user');
const SessionControl = require('./session');

class Point extends Class {
  async getPointsByPagination (data) {
    data = Object.assign({
      userId: null,
      searchType: null,
      keyword: null,
    }, data);
    const {
      userId,
      searchType,
      keyword,
    } = data;
    let queryString = '';
    const queryArray = [];
    if (userId) {
      queryString += `AND p.point_user_ID = ?\n`;
      queryArray.push(userId);
    }
    if (searchType === 'email') {
      queryString += `AND u.email = ?\n`;
      queryArray.push(keyword);
    } else if (searchType === 'nickName') {
      queryString += `AND u.nickName = ?\n`;
      queryArray.push(keyword);
    }
    const pnQuery = `SELECT count(*) AS count
    FROM point AS p
    LEFT JOIN user AS u
    ON p.point_user_ID = u.id
    WHERE p.status = 1
    ${queryString}
    `;
    const [pnResult, ] = await this.conn.query(pnQuery, queryArray);
    const pn = pagination(pnResult, this.req.query, 'page', 10);
    const query = `SELECT p.*, u.nickName AS nickName
    FROM point AS p
    LEFT JOIN user AS u
    ON p.point_user_ID = u.id
    WHERE p.status = 1
    ${queryString}
    ORDER BY p.id DESC
    ${pn.queryLimit}`;
    const [points, ] = await this.conn.query(query, queryArray);
    points.forEach(point => {
      point.datetime = datetime(point.createdAt);
      point.type = this.getType(point.type);
    });
    return {
      points,
      pn,
    };
  }
  async getPoints () {

  }
  async get (pointId) {
    const query = `SELECT *
    FROM point
    WHERE id = ?`;
    const [points, ] = await this.conn.query(query, [
      pointId,
    ]);
    if (points.length) {
      const point = points[0];
      return point;
    } else {
      return null;
    }
  }
  async create (data) {
    data = Object.assign({
      user: null,
      type: null,
      point: null,
      boardId: null,
      articleId: null,
      commentId: null,
      force: false,
    }, data);
    const {
      user,
      type,
      force,
    } = data;
    let {
      point,
    } = data;
    if (!force) {
      point = await this.limitCheck({
        userId: user.id,
        type,
        point,
      });
    }
    if (user && Number(point) !== 0) {
      // 포인트 지급
      let maxPoint = null;
      user.point + Number(point) > user.maxPoint ? maxPoint = user.point + Number(point) : user.point;
      const updateQuery = `UPDATE user SET point = ?, maxPoint = ? WHERE id = ?`;
      await this.conn.query(updateQuery, [user.point + Number(point), maxPoint, user.id]);
      // 포인트 내역 등록
      const insertQuery = `INSERT INTO point (point_user_ID, type, point) VALUES (?, ?, ?)`;
      await this.conn.query(insertQuery, [user.id, type, Number(point)]);
      // 등업
      if (this.setting.useAutoPermission) {
        const permissionClass = new Permission(this.req, this.res, this.conn);
        await permissionClass.check(user);
      }
      const userClass = new User(this.req, this.res, this.conn);
      const newDataUser = await userClass.get({ id: user.id });
      const sessionControl = new SessionControl(this.req, this.res, this.conn);
      await sessionControl.updateUser(newDataUser);
    }
  }
  async remove (data) {
    data = Object.assign({
      user: null,
      type: null,
      point: null,
      boardId: null,
      articleId: null,
      commentId: null,
    }, data);
    const {
      user,
      type,
      point,
      boardId,
      articleId,
      commentId,
    } = data;
    if (user && Number(point) !== 0) {
      // 포인트 차감
      const updateQuery = `UPDATE user
      SET point = ?
      WHERE id = ?`;
      await this.conn.query(updateQuery, [
        user.point + Number(point * -1),
        user.id,
      ]);
      // 포인트 내역 등록
      const insertQuery = `INSERT INTO point
      (point_user_ID, point_board_ID, point_article_ID, point_comment_ID, type, point)
      VALUES (?, ?, ?, ?, ?, ?)`;
      await this.conn.query(insertQuery, [
        user.id,
        boardId,
        articleId,
        commentId,
        type,
        Number(point * -1),
      ]);
      // 등업
      if (this.setting.useAutoPermission) {
        const permissionClass = new Permission(this.req, this.res, this.conn);
        await permissionClass.check(user);
      }
      await this.conn.query(insertQuery, [
        user.id,
        boardId,
        articleId,
        commentId,
        type,
        Number(point * -1),
      ]);
      const userClass = new User(this.req, this.res, this.conn);
      const newDataUser = await userClass.get({
        id: user.id,
      });
      const sessionControl = new SessionControl(this.req, this.res, this.conn);
      await sessionControl.updateUser(newDataUser);
    }
  }
  async check (data) {
    data = Object.assign({
      user: null,
      type: null,
      articleId: null,
    }, data);
    const {
      user,
      type,
      articleId,
    } = data;
    if (user) {
      if (type === 'read') {
        const query = `SELECT * FROM point WHERE point_article_ID = ? AND point_user_ID = ?`;
        const [result, ] = await this.conn.query(query, [articleId, user?.id]);
        if (result.length) {
          return true;
        } else {
          return false;
        }
      }
    } else {
      return false;
    }
  }
  async limitCheck (data) {
    data = Object.assign({
      userId: null,
      type: null,
      point: null,
    }, data);
    const {
      userId,
      type,
      point,
    } = data;
    let sum = null;
    let limit = null;
    if (type === 'createArticle') {
      const query = `SELECT sum(point) AS sum
      FROM point
      WHERE point_user_ID = ?
      AND (type = 'createArticle' OR type = 'removeArticle')
      AND createdAt >= date_format(date_add(CONVERT_TZ(NOW(),@@session.time_zone,'+09:00'), interval -1 day), '%Y-%m-%d');`;
      const [result, ] = await this.conn.query(query, [userId, type]);
      sum = Number(result[0].sum) || 0;
      limit = this.setting.articlePointLimit;
    } else if (type === 'createComment') {
      const query = `SELECT sum(point) AS sum
      FROM point
      WHERE point_user_ID = ?
      AND (type = 'createComment' OR type = 'removeComment')
      AND createdAt >= date_format(date_add(CONVERT_TZ(NOW(),@@session.time_zone,'+09:00'), interval -1 day), '%Y-%m-%d');`;
      const [result, ] = await this.conn.query(query, [
        userId,
        type,
      ]);
      sum = Number(result[0].sum) || 0;
      limit = this.setting.commentPointLimit;
    } else if (type === 'authorLike') {
      const query = `SELECT sum(point) AS sum
      FROM point
      WHERE point_user_ID = ?
      AND type = 'authorLike'
      AND createdAt >= date_format(date_add(CONVERT_TZ(NOW(),@@session.time_zone,'+09:00'), interval -1 day), '%Y-%m-%d');`;
      const [result, ] = await this.conn.query(query, [
        userId,
        type,
      ]);
      sum = Number(result[0].sum) || 0;
      limit = this.setting.authorLikePointLimit;
    } else if (type === 'userLike') {
      const query = `SELECT sum(point) AS sum
      FROM point
      WHERE point_user_ID = ?
      AND type = 'userLike'
      AND createdAt >= date_format(date_add(CONVERT_TZ(NOW(),@@session.time_zone,'+09:00'), interval -1 day), '%Y-%m-%d');`;
      const [result, ] = await this.conn.query(query, [
        userId,
        type,
      ]);
      sum = Number(result[0].sum) || 0;
      limit = this.setting.userLikePointLimit;
    } else {
      return point;
    }
    if (limit === 0) {
      return point;
    } else if (sum < limit) {
      if (limit - sum > sum) {
        return point;
      } else {
        return limit - sum;
      }
    } else {
      return 0;
    }
  }
  getType (type) {
    switch (type) {
      case 'createArticle':
        type = '게시글 작성';
        break;
      case 'removeArticle':
        type = '게시글 삭제';
        break;
      case 'createComment':
        type = '댓글 작성';
        break;
      case 'removeComment':
        type = '댓글 삭제';
        break;
      case 'authorLike':
        type = '좋아요 획득';
        break;
      case 'userLike':
        type = '좋아요 클릭';
        break;
      case 'manual':
        type = '수동';
        break;
      case 'visit':
        type = '방문';
        break;
      case 'check':
        type = '출석';
        break;
      case 'deposit':
        type = '입금';
      case 'withdraw':
        type = '출금';
      case 'invite':
        type = '초대';
        break;
      case 'join':
        type = '가입';
        break;
      case 'free':
        type = '무료';
        break;
    }
    return type;
  }
  async download (data) {
    data = Object.assign({
      userId: null,
      searchType: null,
      keyword: null,
    }, data);
    const {
      userId,
      searchType,
      keyword,
    } = data;
    let queryString = '';
    const queryArray = [];
    if (userId) {
      queryString += `AND p.point_user_ID = ?\n`;
      queryArray.push(userId);
    }
    if (searchType === 'email') {
      queryString += `AND u.email = ?\n`;
      queryArray.push(keyword);
    } else if (searchType === 'nickName') {
      queryString += `AND u.nickName = ?\n`;
      queryArray.push(keyword);
    }
    const query = `SELECT p.*, u.email, u.nickName
    FROM point AS p
    LEFT JOIN user AS u
    ON p.point_user_ID = u.id
    WHERE p.status = 1
    ${queryString}
    ORDER BY p.id DESC`;
    const [pointRaws, ] = await this.conn.query(query, queryArray);
    const points = [];
    pointRaws.forEach(point => {
      point.datetime = datetime(point.createdAt, 'dateTime');
      const data = {
        '날짜': point.datetime,
        '이메일': point.email,
        '닉네임': point.nickName,
        '타입': this.getType(point.type),
        '포인트': point.point,
      };
      points.push(data);
    });
    const json2csv = new Parser({ withBOM: true });
    const csv = json2csv.parse(points);
    return csv;
  }
  async freePoint () {
    if (this.setting.freePointTerm === 'daily') {
      const thisDay = moment(new Date()).format('DD');
      const query = `SELECT *
      FROM point
      WHERE point_user_ID = ?
      AND type = 'freePoint'
      AND date_format(viewDate, '%d') = ?`;
      const [points, ] = await this.conn.query(query, [this.user.id, thisDay]);
      if (points.length) {
        throw new Error('이미 일일 무료포인트가 지급되었습니다');
      } else {
        await this.create({
          user: this.user,
          type: 'freePoint',
          point: this.setting.freePoint,
        });
      }
    } else if (this.setting.freePointTerm === 'weekly') {
      const thisWeek = moment(new Date()).week();
      const query = `SELECT *
      FROM point
      WHERE point_user_ID = ?
      AND type = 'freePoint'
      AND WEEK(createdAt) = ?`;
      const [points, ] = await this.conn.query(query, [this.user.id, thisWeek - 1]);
      if (points.length) {
        throw new Error('이미 주간 무료포인트가 지급되었습니다');
      } else {
        await this.create({
          user: this.user,
          type: 'freePoint',
          point: this.setting.freePoint,
        });
      }
    } else if (this.setting.freePointTerm === 'montly') {
      const thisMonth = moment(new Date()).format('MM');
      const query = `SELECT *
      FROM point
      WHERE point_user_ID = ?
      AND type = 'freePoint'
      AND date_format(viewDate, '%m') = ?`;
      const [points, ] = await this.conn.query(query, [this.user.id, thisMonth]);
      if (points.length) {
        throw new Error('이미 월간 무료포인트가 지급되었습니다');
      } else {
        await this.create({
          user: this.user,
          type: 'freePoint',
          point: this.setting.freePoint,
        });
      }
    }
  }
}

module.exports = Point;