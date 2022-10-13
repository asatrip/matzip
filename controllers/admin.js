const { timezone } = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault(timezone);
const pool = require('../middleware/database');
const doAsync = require('../middleware/doAsync');
const hashCreate = require('../middleware/hash');
const imageUpload = require('../middleware/imageUpload');
const flash = require('../middleware/flash');
const pagination = require('../middleware/pagination');
const datetime = require('../middleware/datetime');
const emptyCheck = require('../middleware/emptyCheck');
const counter = require('../services/counter');
const Point = require('../services/point');
const Chat = require('../services/chat');
const Menu = require('../services/menu');
const User = require('../services/user');
const UserGroup = require('../services/userGroup');
const UserUserGroup = require('../services/userUserGroup');
const UserGroupBoard = require('../services/userGroupBoard');
const PermissionBoard = require('../services/permissionBoard');
const Board = require('../services/board');
const Category = require('../services/category');
const Article = require('../services/article');
const Comment = require('../services/comment');
const Message = require('../services/message');
const Report = require('../services/report');
const Banner = require('../services/banner');
const Go = require('../services/go');
const Page = require('../services/page');
const Permission = require('../services/permission');
const Setting = require('../services/setting');
const SectionGroup = require('../services/sectionGroup');
const Section = require('../services/section');
const Log = require('../services/log');
const Favicon = require('../services/favicon');
const Parsing = require('../services/parsing');
const config = require('../middleware/config');
const cache = require('../services/cache');
const SessionControl = require('../services/session');

/* AWS S3 */
const AWS = require('aws-sdk');
const s3Info = config.getStorage();

const {
  accessKeyId,
  secretAccessKey,
  region,
  bucket,
  host,
  endpoint,
} = s3Info;

const spacesEndpoint = new AWS.Endpoint(endpoint);
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

exports.index = doAsync(async (req, res, next) => {
  res.redirect('/admin/log');
});

exports.log = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const logClass = new Log(req, res, conn);
    const { logs, pn } = await logClass.getLogsByPagination();
    const { today, yesterday, month } = cache.count;

    res.render('admin/log', {
      pageTitle: `로그 - ${res.locals.setting.siteName}`,
      logs,
      pn,
      today,
      yesterday,
      month,
    });
  } finally {
    conn.release();
  }
});

exports.user = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      searchType,
      keyword,
    } = req.query;
    const userClass = new User(req, res, conn);
    const userCount = await userClass.getTotalCount();
    const data = {
      searchType,
      keyword,
    };
    const { users, pn } = await userClass.getUsersByPagination(data, 10);
    res.render('admin/user', {
      pageTitle: `회원 - ${res.locals.setting.siteName}`,
      users,
      userCount,
      pn,
      searchType,
      keyword,
    });
  } finally {
    conn.release();
  }
});

exports.userNew = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      submit,
    } = req.body;
    const userHash = hashCreate(6);
    let password = null
    let nickName = null
    let email = null
    let permission = null
    let workingUser = null;
    if (submit === 'new') {
      email = req.body.email;
      password = req.body.password;
      nickName = req.body.nickName;
      permission = req.body.permission;
      workingUser = req.body.workingUser || 0;
    } else if (submit === 'random') {
      email = userHash;
      password = userHash;
      nickName = userHash;
      permission = 1;
      workingUser = 1;
    }
    if (emptyCheck(email, password, nickName, permission, workingUser)) {
      const data = {
        email,
        password,
        nickName,
        permission,
        workingUser,
        emailAuthentication: 1,
      };
      const userClass = new User(req, res, conn);
      try {
        await userClass.create(data);
        flash.create({
          status: true,
          message: '회원이 생성되었습니다',
        });
      } catch (e) {
        flash.create({
          status: false,
          message: e.message,
        });
      }
    } else {
      flash.create({
        status: false,
        message: '모든 입력란을 입력해주세요',
      });
    }
    res.redirect('/admin/user');
  } finally {
    conn.release();
  }
});

exports.userEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      userId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const userClass = new User(req, res, conn);
    const sessionControl = new SessionControl(req, res, conn);
    if (submit === 'edit') {
      const {
        email,
        password,
        nickName,
        phone,
        permission,
        workingUser,
        pointMethod,
        point,
      } = req.body;
      const data = {
        email,
        password,
        nickName,
        phone,
        permission,
        workingUser,
      };
      if (pointMethod && point) {
        const user = await userClass.get({ id: userId });
        const pointClass = new Point(req, res, conn);
        if (pointMethod === 'create') {
          const data = {
            user,
            type: 'manual',
            point,
          };
          try {
            await pointClass.create(data);
            flash.create({
              status: true,
              message: '포인트 지급 완료',
            });
          } catch (e) {
            flash.create({
              status: false,
              message: e.message,
            });
          }
        } else if (pointMethod === 'remove') {
          const data = {
            user,
            type: 'manual',
            point,
          };
          try {
            await pointClass.remove(data);
            flash.create({
              status: true,
              message: '포인트 차감 완료',
            });
          } catch (e) {
            flash.create({
              status: false,
              message: e.message,
            });
          }
        }
      } else {
        try {
          await userClass.update(userId, data);
          await sessionControl.updateUser(userId);
          flash.create({
            status: true,
            message: '수정 완료',
          });
        } catch (e) {
          if (e.errno === 1062) {
            flash.create({
              status: false,
              message: '닉네임 중복입니다',
            });
          } else {
            flash.create({
              status: false,
              message: e.message,
            });
          }
        }
      }
    } else if (submit === 'delete') {
      try {
        await userClass.remove(userId);
        flash.create({
          status: true,
          message: '삭제 완료',
        });
      } catch (e) {
        flash.create({
          status: false,
          message: e.message,
        });
      }
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.userDetail = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      userId,
    } = req.params;
    const {
      method,
    } = req;
    if (method === 'GET') {
      const userClass = new User(req, res, conn);
      const user = await userClass.get({ id: userId });
      const userUserGroupClass = new UserUserGroup(req, res, conn);
      const userUserGroups = await userUserGroupClass.getUserUserGroups(userId);
      const pointClass = new Point(req, res, conn);
      const { points, pn } = await pointClass.getPointsByPagination({ userId: user.id });
      res.render('admin/userDetail', {
        pageTitle: `${user.email} (${user.nickName}) 유저 - ${res.locals.setting.siteName}`,
        user,
        userUserGroups,
        points,
        pn,
      });
    } else if (method === 'POST') {
      const {
        submit,
      } = req.body;
      if (submit === 'userGroup') {
        const {
          userGroups,
        } = req.body;
        const userUserGroupClass = new UserUserGroup(req, res, conn);
        await userUserGroupClass.set(userId, userGroups);
      }
      res.redirect(req.headers.referer);
    }
  } finally {
    conn.release();
  }
});

exports.menu = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const menuClass = new Menu(req, res, conn);
    const menus = await menuClass.getMenus({
      status: false,
    });
    const boards = cache.boards;
    const pages = cache.pages;
    const gos = cache.gos;
    res.render('admin/menu', {
      pageTitle: `메뉴 - ${res.locals.setting.siteName}`,
      menus,
      boards,
      pages,
      gos,
    });
  } finally {
    conn.release();
  }
});

exports.menuNew = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      type,
      title,
      target,
    } = req.body;
    if (title) {
      const data = {
        type,
        title,
        target,
      }
      const menuClass = new Menu(req, res, conn);
      await menuClass.create(data);
    } else {
      flash.create({
        status: false,
        message: '메뉴 이름을 입력해주세요',
      });
    }
    res.redirect('/admin/menu');
  } finally {
    conn.release();
  }
});

exports.menuEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      menuId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const menuClass = new Menu(req, res, conn);
    if (submit === 'add') {
      const data = {
        parentId: menuId,
        title: '',
        target: '',
      };
      await menuClass.create(data);
    } else if (submit === 'status') {
      const menu = await menuClass.get(menuId);
      if (menu.status) {
        await menuClass.update(menuId, { status: 0 });
      } else {
        await menuClass.update(menuId, { status: 1 });
      }
    } else if (submit === 'edit') {
      const {
        type,
        title,
        target,
        viewOrder,
      } = req.body;
      const data = {
        type,
        title,
        target,
        viewOrder,
      };
      try {
        await menuClass.update(menuId, data);
        flash.create({
          status: true,
          message: '수정 완료',
        })
      } catch (e) {
        flash.create({
          status: false,
          message: e.message,
        });
      }
    } else if (submit === 'delete') {
      await menuClass.remove(menuId);
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.board = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const boardClass = new Board(req, res, conn);
    const { boards, pn } = await boardClass.getBoardsByPagination(10);
    res.render('admin/board', {
      pageTitle: `게시판 - ${res.locals.setting.siteName}`,
      boards,
      pn,
    });
  } finally {
    conn.release();
  }
});

exports.boardNew = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      title,
      type,
    } = req.body;
    const slug = req.body.slug || hashCreate(6);
    const boardClass = new Board(req, res, conn);
    const userGroupBoardClass = new UserGroupBoard(req, res, conn);
    const permissionBoardClass = new PermissionBoard(req, res, conn);
    const data = {
      title,
      slug,
      type,
    }
    try {
      const boardId = await boardClass.create(data);
      await userGroupBoardClass.create({ boardId });
      await permissionBoardClass.create({ boardId });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.boardEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      boardId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const boardClass = new Board(req, res, conn);
    if (submit === 'edit') {
      const {
        title,
        slug,
        type,
        listCount,
        listPermission,
        readPermission,
        writePermission,
        commentPermission,
      } = req.body;
      const data = {
        title,
        slug,
        type,
        listCount,
        listPermission,
        readPermission,
        writePermission,
        commentPermission,
      };
      boardClass.update(boardId, data);
    } else if (submit === 'delete') {
      boardClass.remove(boardId);
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.boardDetail = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      method,
    } = req;
    const {
      boardId,
    } = req.params;
    const boardClass = new Board(req, res, conn);
    const userGroupClass = new UserGroup(req, res, conn);
    const permissionClass = new Permission(req, res, conn);
    const bannerClass = new Banner(req, res, conn);
    const userGroups = await userGroupClass.getUserGroupsByBoardId(boardId);
    const permissions = await permissionClass.getPermissionsByBoardId(boardId);
    const banners = await bannerClass.getBanners({
      boardId,
    });
    const board = cache.boards.find(board => board.id === Number(boardId));
    if (method === 'GET') {
      res.render('admin/boardDetail', {
        pageTitle: ``,
        board,
        userGroups,
        permissions,
        banners,
      });
    } else if (method === 'POST') {
      const {
        submit,
      } = req.body;
      if (submit === 'detail') {
        const {
          writePoint,
          commentPoint,
          readPoint,
          useSecret,
          useAnonymous,
          useLinks,
          useFiles,
          useHtml,
          usePermissionLimit,
          useUserGroupPermission,
          useUserAlarm,
          useAdminAlarm,
        } = req.body;
        const data = {
          writePoint,
          commentPoint,
          readPoint,
          useSecret,
          useAnonymous,
          useLinks,
          useFiles,
          useHtml,
          usePermissionLimit,
          useUserGroupPermission,
          useUserAlarm,
          useAdminAlarm,
        };
        await boardClass.update(boardId, data);
      } else if (submit === 'introduce') {
        const {
          content,
        } = req.body;
        const data = {
          content,
        };
        const getKey = async () => {
          if (req.files.image) {
            const image = req.files.image[0] || null;
            const key = await imageUpload(image, 'board');
            const params = {
              Bucket: bucket,
              Key: `board/${board.image}`,
            };
            s3.deleteObject(params, (err, data) => {
              if (err) {
                console.error(err);
              }
            });
            return key;
          } else {
            return null;
          }
        };
        const key = await getKey();
        if (key) data.image = key;
        await boardClass.update(boardId, data);
      } else if (submit === 'customField') {
        const {
          useCustomField01,
          useCustomField02,
          useCustomField03,
          useCustomField04,
          useCustomField05,
          useCustomField06,
          useCustomField07,
          useCustomField08,
          useCustomField09,
          useCustomField10,
          customFieldTitle01,
          customFieldTitle02,
          customFieldTitle03,
          customFieldTitle04,
          customFieldTitle05,
          customFieldTitle06,
          customFieldTitle07,
          customFieldTitle08,
          customFieldTitle09,
          customFieldTitle10,
        } = req.body;
        const data = {
          useCustomField01,
          useCustomField02,
          useCustomField03,
          useCustomField04,
          useCustomField05,
          useCustomField06,
          useCustomField07,
          useCustomField08,
          useCustomField09,
          useCustomField10,
          customFieldTitle01,
          customFieldTitle02,
          customFieldTitle03,
          customFieldTitle04,
          customFieldTitle05,
          customFieldTitle06,
          customFieldTitle07,
          customFieldTitle08,
          customFieldTitle09,
          customFieldTitle10,
        };
        await boardClass.update(boardId, data);
      }
      res.redirect(req.headers.referer);
    }
  } finally {
    conn.release();
  }
});

exports.boardCustomHtml = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      boardId,
    } = req.params;
    const {
      headerHtml,
      footerHtml,
    } = req.body;
    const data = {
      headerHtml,
      footerHtml,
    };
    const boardClass = new Board(req, res, conn);
    await boardClass.update(boardId, data);
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.boardDetailPermission = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      boardId,
      permissionId,
    } = req.params;
    const {
      articleLimitType,
      articleLimitCount,
    } = req.body;
    const permissionBoardClass = new PermissionBoard(req, res, conn);
    await permissionBoardClass.update(boardId, permissionId, {
      articleLimitType,
      articleLimitCount,
    });
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.boardDetailUserGroup = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      boardId,
      userGroupId,
    } = req.params;
    const {
      listPermission,
      readPermission,
      writePermission,
      commentPermission,
    } = req.body;
    const userGroupBoardClass = new UserGroupBoard(req, res, conn);
    await userGroupBoardClass.update(boardId, userGroupId, {
      listPermission,
      readPermission,
      writePermission,
      commentPermission,
    });
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.categoryNew = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      boardId,
      title,
    } = req.body;
    const categoryClass = new Category(req, res, conn);
    const data = {
      title,
    };
    await categoryClass.create(boardId, data);
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.categoryEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      categoryId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const categoryClass = new Category(req, res, conn);
    if (submit === 'edit') {
      const {
        title,
        viewOrder,
      } = req.body;
      const data = {
        title,
        viewOrder,
      };
      await categoryClass.update(categoryId, data);
    } else if (submit === 'delete') {
      await categoryClass.remove(categoryId);
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.article = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      searchType,
      keyword,
    } = req.query;
    const articleClass = new Article(req, res, conn);
    const data = {
      searchType,
      keyword,
      images: false,
      datetimeType: 'dateTime',
    };
    const { articles, pn } = await articleClass.getArticlesByPagination(data);
    const boards = cache.boards;
    articles.forEach(article => {
      const board = boards.find(board => board.id === article.article_board_ID);
      article.categories = board.categories;
    });
    res.render('admin/article', {
      pageTitle: `게시글 - ${res.locals.setting.siteName}`,
      articles,
      boards,
      pn,
      searchType,
      keyword,
    });
  } finally {
    conn.release();
  }
});

exports.articleEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      articleId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const userClass = new User(req, res, conn);
    const articleClass = new Article(req, res, conn);
    if (submit === 'status') {
      const article = await articleClass.get({
        id: articleId,
      });
      if (article.status === 2) {
        const data = {
          status: 1,
        };
        await articleClass.update(articleId, data);
      } else if (article.status === 1) {
        const data = {
          status: 2,
        };
        await articleClass.update(articleId, data);
      }
    } else if (submit === 'edit') {
      const {
        board,
        nickName,
        viewCount,
        datetime,
        category,
      } = req.body;
      const user = await userClass.get({
        nickName,
      });
      if (user) {
        const data = {
          boardId: board,
          userId: user.id,
          categoryId: category || null,
          viewCount,
          updatedAt: moment(datetime).tz('UTC').format('YYYY-MM-DD HH:mm:ss'),
          createdAt: moment(datetime).tz('UTC').format('YYYY-MM-DD HH:mm:ss'),
        };
        await articleClass.update(articleId, data);
      } else {
        flash.create({
          status: false,
          message: `해당 유저가 없습니다`,
        });
      }
    } else if (submit === 'delete') {
      await articleClass.remove(articleId);
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.comment = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      searchType,
      keyword,
    } = req.query;
    let pn = null;
    let comments = [];
    if (searchType === 'content') {
      const pnQuery = `SELECT count(*) AS count
      FROM comment AS c
      WHERE c.status = 1 AND c.content LIKE CONCAT('%',?,'%')`;
      const [pnResult, ] = await conn.query(pnQuery, [keyword]);
      pn = pagination(pnResult, req.query, 'page');
      const query = `SELECT c.*, u.nickName AS nickName
      FROM comment AS c
      LEFT JOIN user AS u
      ON c.comment_user_ID = u.id
      WHERE c.status = 1 AND c.content LIKE CONCAT('%',?,'%')
      ORDER BY id DESC
      ${pn.queryLimit}`;
      [comments, ] = await conn.query(query, [keyword]);
    } else {
      const pnQuery = `SELECT count(*) AS count FROM comment WHERE status = 1`;
      const [pnResult, ] = await conn.query(pnQuery);
      pn = pagination(pnResult, req.query, 'page');
      const query = `SELECT c.*, u.nickName AS nickName
      FROM comment AS c
      LEFT JOIN user AS u
      ON c.comment_user_ID = u.id
      WHERE c.status = 1
      ORDER BY id DESC
      ${pn.queryLimit}`;
      [comments, ] = await conn.query(query);
    }
    comments.forEach(comment => {
      comment.datetime = moment(comment.createdAt).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
    });
    res.render('admin/comment', {
      pageTitle: `댓글 - ${res.locals.setting.siteName}`,
      comments,
      pn,
      searchType,
      keyword,
    });
  } finally {
    conn.release();
  }
});

exports.commentEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      commentId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const user = res.locals.user;
    if (submit === 'edit') {
      const {
        nickName,
        datetime,
        content,
      } = req.body;
      const [users, ] = await conn.query(`SELECT * FROM user WHERE nickName = ?`, [
        nickName,
      ]);
      if (users.length) {
        const user = users[0];
        await conn.query(`UPDATE comment SET comment_user_ID = ?, content = ?, updatedAt = ?, createdAt = ? WHERE id = ?`, [
          user.id,
          content,
          datetime,
          datetime,
          commentId,
        ]);
      } else {
        flash.create({
          status: false,
          message: `유저가 존재하지 않습니다`,
        });
      }
    } else if (submit === 'delete') {
      const [comments, ] = await conn.query(`SELECT * FROM comment WHERE id = ?`, [
        commentId,
      ]);
      if (comments.length) {
        const comment = comments[0];
        // Delete Comment
        if (comment.comment_user_ID === user.id || user.isAdmin) {
          await conn.query(`UPDATE comment SET status = ? WHERE id = ?`, [
            0,
            comment.id,
          ]);
          await conn.query(`UPDATE article SET commentCount=commentCount-1, updatedAt=NOW() WHERE id = ?`, [
            comment.comment_article_ID,
          ]);
          await conn.query(`UPDATE comment SET replyCount=replyCount-1 WHERE id = ?`, [
            comment.parent_comment_id,
          ]);
          if (comment.parent_comment_id && comment.parent_comment_id != comment.comment_group_id) {
            await conn.query(`UPDATE comment SET replyCount=replyCount-1 WHERE id = ?`, [
              comment.comment_group_id,
            ]);
          }
        }
      }
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.chat = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const pnQuery = `SELECT count(*) AS count FROM chat`;
    const [pnResult, ] = await conn.query(pnQuery);
    const pn = pagination(pnResult, req.query, 'page');
    const query = `SELECT c.*, u.nickName AS nickName
    FROM chat AS c
    LEFT JOIN user AS u
    ON c.chat_user_ID = u.id
    ORDER BY c.id DESC
    ${pn.queryLimit}`;
    const [chats, ] = await conn.query(query);
    chats.forEach(c => {
      c.datetime = moment(c.createdAt).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
    });
    res.render('admin/chat', {
      pageTitle: `채팅 - ${res.locals.setting.siteName}`,
      chats,
      pn,
    });
  } finally {
    conn.release();
  }
});

exports.chatEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      chatId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const chatClass = new Chat(req, res, conn);
    if (submit === 'edit') {
      const {
        message,
      } = req.body;
      const data = {
        message,
      };
      await chatClass.update(chatId, data);
    } else if (submit === 'delete') {
      await chatClass.remove(chatId);
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.chatDeleteAll = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const chatClass = new Chat(req, res, conn);
    await chatClass.removeAll();
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.point = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      searchType,
      keyword,
    } = req.query;
    const pointClass = new Point(req, res, conn);
    const options = {
      searchType,
      keyword,
    };
    const { points, pn } = await pointClass.getPointsByPagination(options);
    res.render('admin/point', {
      pageTitle: `포인트 - ${res.locals.setting.siteName}`,
      points,
      pn,
      searchType,
      keyword,
    });
  } finally {
    conn.release();
  }
});

exports.pointDownload = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      userId,
      searchType,
      keyword,
    } = req.body;
    const pointClass = new Point(req, res, conn);
    const data = {
      userId,
      searchType,
      keyword,
    };
    const csv = await pointClass.download(data);
    res.header('Content-Type', 'text/csv');
    res.attachment(`${datetime(new Date(), 'dateTime')}.csv`);
    res.send(csv);
  } finally {
    conn.release();
  }
});

exports.message = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const messageClass = new Message(req, res, conn);
    const { messages, pn } = await messageClass.getMessagesByPagination(10);
    res.render('admin/message', {
      pageTitle: `메시지 - ${res.locals.setting.siteName}`,
      messages,
      pn,
    });
  } finally {
    conn.release();
  }
});

exports.messageEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      messageId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const messageClass = new Message(req, res, conn);
    if (submit === 'edit') {

    } else if (submit === 'delete') {
      await messageClass.remove(messageId);
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.report = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const reportClass = new Report(req, res, conn);
    const { reports, pn } = await reportClass.getReports();
    res.render('admin/report', {
      pageTitle: `리포트 - ${res.locals.setting.siteName}`,
      reports,
      pn,
    });
  } finally {
    conn.release();
  }
});

exports.reportEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      reportId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const reportClass = new Report(req, res, conn);
    const report = await reportClass.get(reportId);
    if (submit === 'restore') {
      if (report.report_article_ID) {
        const articleClass = new Article(req, res, conn);
        await articleClass.update(report.report_article_ID, { reportCount: 0, force: true });
      } else if (report.report_comment_ID) {
        const commentClass = new Comment(req, res, conn);
        await commentClass.update(report.report_comment_ID, { reportCount: 0, force: true });
      } else if (report.report_message_ID) {
        const messageClass = new Message(req, res, conn);
        await messageClass.update(report.report_message_ID, { reportCount: 0, force: true });
      }
    } else if (submit === 'delete') {
      if (report.report_article_ID) {
        const articleClass = new Article(req, res, conn);
        await articleClass.remove(report.report_article_ID);
      } else if (report.report_comment_ID) {
        const commentClass = new Comment(req, res, conn);
        await commentClass.remove(report.report_comment_ID);
      } else if (report.report_message_ID) {
        const messageClass = new Message(req, res, conn);
        await messageClass.remove(report.report_message_ID);
      }
    }
    const data = {
      status: 0,
    };
    await reportClass.update(reportId, data);
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.userGroup = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const userGroupClass = new UserGroup(req, res, conn);
    const userGroups = await userGroupClass.getUserGroups();
    res.render('admin/userGroup', {
      pageTitle: `리포트 - ${res.locals.setting.siteName}`,
      userGroups,
    });
  } finally {
    conn.release();
  }
});

exports.userGroupNew = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      title,
      slug,
    } = req.body;
    const userGroupClass = new UserGroup(req, res, conn);
    const data = {
      title,
      slug,
    };
    const userGroupId = await userGroupClass.create(data);
    const userGroupBoardClass = new UserGroupBoard(req, res, conn);
    const userGroupBoardData = {
      userGroupId,
    };
    await userGroupBoardClass.create(userGroupBoardData);
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.userGroupEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      userGroupId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const userGroupClass = new UserGroup(req, res, conn);
    if (submit === 'edit') {
      const {
        title,
        slug,
        viewOrder,
      } = req.body;
      const data = {
        title,
        slug,
        viewOrder,
      };
      await userGroupClass.update(userGroupId, data);
    } else if (submit === 'delete') {
      await userGroupClass.remove(userGroupId);
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.pointWithdraw = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      pointWithdrawId,
    } = req.params;
    const {
      method,
    } = req;
    if (method === 'GET') {
      const pnQuery = `SELECT count(*) AS count FROM pointWithdraw WHERE status = 1`;
      const [pnResult, ] = await conn.query(pnQuery);
      const pn = pagination(pnResult, req.query, 'page');
      const query = `SELECT p.*, u.nickName
      FROM pointWithdraw AS p
      JOIN user AS u
      ON pointWithdraw_user_ID = u.id
      WHERE p.status = 1
      ORDER BY p.id DESC
      ${pn.queryLimit}`;
      const [pointWithDrawList, ] = await conn.query(query);
      pointWithDrawList.forEach(p => {
        p.datetime = moment(p.createdAt).tz(timezone).format('YY-MM-DD HH:mm:ss');
      });
      res.render('admin/pointWithdraw', {
        pageTitle: `포인트 출금 - ${res.locals.setting.siteName}`,
        pointWithDrawList,
        pn,
      });
    } else if (method === 'POST') {
      const {
        submit,
      } = req.body;
      if (submit === 'complete') {
        await conn.query(`UPDATE pointWithdraw SET status=0 WHERE id = ?`, [pointWithdrawId]);
      } else if (submit === 'reject') {
        const {
          userId,
          point,
        } = req.body;
        // 포인트 복구
        await conn.query(`UPDATE user SET point=point+? WHERE id = ?`, [point, userId]);
        await conn.query(`DELETE FROM pointWithdraw WHERE id = ?`, [pointWithdrawId]);
        await conn.query(`INSERT INTO point (point_user_ID, type, point) VALUES (?, ?, ?)`, [userId, 'withdrawReject', point]);
      }
      res.redirect('/admin/pointWithdraw');
    }
  } finally {
    conn.release();
  }
});

exports.page = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const pageClass = new Page(req, res, conn);
    const { pages, pn } = await pageClass.getPagesByPagination();
    res.render('admin/page/list', {
      pageTitle: `페이지 - ${res.locals.setting.siteName}`,
      pages,
      pn,
    });
  } finally {
    conn.release();
  }
});

exports.pageNew = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      method,
    } = req;
    if (method === 'GET') {
      res.render('admin/page/new', {
        pageTitle: `페이지 - ${res.locals.setting.siteName}`,
      });
    } else if (method === 'POST') {
      const {
        title,
        slug,
        html,
        css,
        javascript,
      } = req.body;
      const pageClass = new Page(req, res, conn);
      const data = {
        title,
        slug,
        html,
        css,
        javascript,
      };
      try {
        await pageClass.create(data);
      } catch (e) {
        flash.create({
          status: false,
          message: e.message,
        });
      }
      res.redirect('/admin/page');
    }
  } finally {
    conn.release();
  }
});

exports.pageEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      pageId,
    } = req.params;
    const {
      method,
    } = req;
    const pageClass = new Page(req, res, conn);
    if (method === 'GET') {
      const page = await pageClass.get(pageId);
      res.render(`admin/page/edit`, {
        pageTitle: `관리자 - ${res.locals.setting.siteName}`,
        page,
      });
    } else if (method === 'POST') {
      const {
        submit,
      } = req.body;
      if (submit === 'status') {
        const page = await pageClass.get(pageId);
        if (page.status) {
          await pageClass.update(pageId, {
            status: 0,
          });
        } else {
          await pageClass.update(pageId, {
            status: 1,
          });
        }
      } else if (submit === 'delete') {
        await pageClass.remove(pageId);
      }
      res.redirect('/admin/page');
    }
  } finally {
    conn.release();
  }
});

exports.pageUpdate = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      pageId,
    } = req.params;
    const {
      title,
      slug,
      html,
      css,
      javascript,
    } = req.body;
    const pageClass = new Page(req, res, conn);
    const data = {
      title,
      slug,
      html,
      css,
      javascript,
    };
    await pageClass.update(pageId, data);
    res.redirect('/admin/page');
  } finally {
    conn.release();
  }
});

exports.banner = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      method,
    } = req;
    if (method === 'GET') {
      const bannerClass = new Banner(req, res, conn);
      const headerCount = await bannerClass.getCount('header');
      const indexTopCount = await bannerClass.getCount('indexTop');
      const indexBottomCount = await bannerClass.getCount('indexBottom');
      const sideTopCount = await bannerClass.getCount('sideTop');
      const sideBottomCount = await bannerClass.getCount('sideBottom');
      const articleTopCount = await bannerClass.getCount('articleTop');
      const articleBottomCount = await bannerClass.getCount('articleBottom');
      const leftWingCount = await bannerClass.getCount('leftWing');
      const rightWingCount = await bannerClass.getCount('rightWing');
      const customCount = await bannerClass.getCount('custom');
      const popupCount = await bannerClass.getCount('popup');
      res.render('admin/banner', {
        pageTitle: `배너 - ${res.locals.setting.siteName}`,
        headerCount,
        indexTopCount,
        indexBottomCount,
        sideTopCount,
        sideBottomCount,
        articleTopCount,
        articleBottomCount,
        leftWingCount,
        rightWingCount,
        customCount,
        popupCount,
      });
    } else if (method === 'POST') {
      const {
        position,
        align,
      } = req.body;
      const settingClass = new Setting(req, res, conn);
      if (position === 'header') {
        await settingClass.update({ bannerAlignHeader: align });
      } else if (position === 'indexTop') {
        await settingClass.update({ bannerAlignIndexTop: align });
      } else if (position === 'indexBottom') {
        await settingClass.update({ bannerAlignIndexBottom: align });
      } else if (position === 'sideTop') {
        await settingClass.update({ bannerAlignSideTop: align });
      } else if (position === 'sideBottom') {
        await settingClass.update({ bannerAlignSideBottom: align });
      } else if (position === 'articleTop') {
        await settingClass.update({ bannerAlignArticleTop: align });
      } else if (position === 'articleBottom') {
        await settingClass.update({ bannerAlignArticleBottom: align });
      } else if (position === 'leftWing') {
        await settingClass.update({ bannerAlignLeftWing: align });
      } else if (position === 'rightWing') {
        await settingClass.update({ bannerAlignRightWing: align });
      } else if (position === 'custom') {
        await settingClass.update({ bannerAlignCustom: align });
      } else if (position === 'popup') {
        await settingClass.update({ bannerAlignPopup: align });
      }
      res.redirect(req.headers.referer);
    }
  } finally {
    conn.release();
  }
});

exports.bannerDetail = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      position,
    } = req.params;
    const bannerClass = new Banner(req, res, conn);
    const data = {
      position,
    };
    const banners = await bannerClass.getBanners(data);
    let positionTitle = null;
    if (position === 'header') {
      positionTitle = '헤더';
    } else if (position === 'indexTop') {
      positionTitle = '첫페이지 상단';
    } else if (position === 'indexBottom') {
      positionTitle = '첫페이지 하단';
    } else if (position === 'sideTop') {
      positionTitle = '사이드 상단';
    } else if (position === 'sideBottom') {
      positionTitle = '사이드 하단';
    } else if (position === 'articleTop') {
      positionTitle = '본문 상단';
    } else if (position === 'articleBottom') {
      positionTitle = '본문 하단';
    } else if (position === 'leftWing') {
      positionTitle = '날개 좌측';
    } else if (position === 'rightWing') {
      positionTitle = '날개 우측';
    } else if (position === 'custom') {
      positionTitle = '커스텀';
    } else if (position === 'popup') {
      positionTitle = '팝업';
    }
    res.render('admin/bannerDetail', {
      pageTitle: `배너 - ${res.locals.setting.siteName}`,
      banners,
      position,
      positionTitle,
    });
  } finally {
    conn.release();
  }
});

exports.bannerNew = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      boardId,
      position,
      link,
      viewOrder,
    } = req.body;
    const newPage = req.body.newPage || 0;
    const bannerClass = new Banner(req, res, conn);
    if (req.files.image) {
      const image = req.files.image[0];
      const key = await imageUpload({
        image,
        folder: 'banner',
      });
      const query = `INSERT INTO banner
      (banner_board_ID, position, image, link, viewOrder, newPage)
      VALUES (?, ?, ?, ?, ?, ?)`;
      const [result, ] = await conn.query(query, [boardId, position, key, link, viewOrder, newPage]);
      if (result.insertId) {
        await bannerClass.set();
        flash.create({
          status: true,
          message: '배너 등록에 성공하였습니다',
        });
      } else {
        flash.create({
          status: false,
          message: '배너 등록에 실패하였습니다',
        });
      }
    } else {
      flash.create({
        status: false,
        message: '배너 이미지를 등록해주세요',
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.bannerEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      bannerId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const bannerClass = new Banner(req, res, conn);
    if (submit === 'hide') {
      const [banners, ] = await conn.query(`SELECT * FROM banner WHERE id = ?`, [bannerId]);
      if (banners.length) {
        const banner = banners[0];
        if (banner.status === 1) {
          await conn.query(`UPDATE banner SET status = ? WHERE id = ?`,[0, bannerId]);
        } else if (banner.status === 0) {
          await conn.query(`UPDATE banner SET status = ? WHERE id = ?`,[1, bannerId]);
        }
        await bannerClass.set();
        res.redirect(req.headers.referer);
      }
    } else if (submit === 'edit') {
      const {
        position,
        link,
        viewOrder,
      } = req.body;
      if (req.files.image) {
        const image = req.files.image[0];
        // Delete Old banner
        const banner = res.locals.banners.find(b => b.id === Number(bannerId));
        const oldKey = banner.image;
        const params = {
          Bucket: bucket,
          Key: `banner/${oldKey}`,
        };
        s3.deleteObject(params, async (err, data) => {
          if (err) {
            console.error(err);
          }
        });
        // New Image
        const key = await imageUpload({
          image,
          folder: 'banner',
        });
        await conn.query(`UPDATE banner SET image = ? WHERE id = ?`, [key, bannerId]);
      }

      const newPage = req.body.newPage || 0;
      const desktopHide = req.body.desktopHide || 0;
      const mobileHide = req.body.mobileHide || 0;
      await conn.query(`UPDATE banner SET position = ?, link = ?, viewOrder = ?, newPage = ?, desktopHide = ?, mobileHide = ? WHERE id = ?`, [position, link, viewOrder, newPage, desktopHide, mobileHide, bannerId]);
      await bannerClass.set();
      res.redirect(req.headers.referer);
    } else if (submit === 'delete') {
      const [result, ] = await conn.query(`SELECT * FROM banner WHERE id = ?`, [bannerId]);
      const key = result[0].image;
      const params = {
        Bucket: bucket,
        Key: `banner/${key}`,
      };
      s3.deleteObject(params, async (err, data) => {
        if (err) {
          console.error(err);
        } else {
        }
      });
      await conn.query(`DELETE FROM banner WHERE id = ?`, [bannerId]);
      await bannerClass.set();
      res.redirect(req.headers.referer);
    }
  } finally {
    conn.release();
  }
});

// Message
exports.totalMessage = doAsync(async (req, res, next) => {
  res.render('admin/totalMessage', {
    pageTitle: `전체 메시지 - ${res.locals.setting.siteName}`,
  });
});

exports.sendMessage = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      content,
    } = req.body;
    const user = res.locals.user;
    const query = `SELECT *
    FROM user
    WHERE id != ?`;
    const [targetUsers, ] = await conn.query(query, [user.id]);
    for (let targetUser of targetUsers) {
      const messageQuery = `INSERT INTO
      message
      (message_sender_ID, message_recipient_ID, content)
      VALUES (?, ?, ?)`;
      const [result, ] = await conn.query(messageQuery, [user.id, targetUser.id, content]);
      await conn.query(`INSERT INTO alarm (type, alarm_user_ID, alarm_relatedUser_ID, alarm_message_ID) VALUES (?, ?, ?, ?)`, ['message', targetUser.id, user.id, result.insertId]);
    }
    flash.create({
      status: true,
      message: '전체 메시지 발송 완료',
    });
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.sendEmail = doAsync(async (req, res, next) => {
  res.redirect(req.headers.referer);
});

exports.sectionGroup = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const [adminSectionGroups, ] = await conn.query(`SELECT * FROM sectionGroup ORDER BY viewOrder ASC, id ASC`);
    const boards = res.locals.boards;
    res.render('admin/sectionGroup', {
      pageTitle: `첫페이지 - ${res.locals.setting.siteName}`,
      adminSectionGroups,
      boards,
    });
  } finally {
    conn.release();
  }
});

exports.sectionGroupNew = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      type,
    } = req.body;
    const sectionGroupClass = new SectionGroup(req, res, conn);
    const data = {
      type,
    }
    await sectionGroupClass.create(data);
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.sectionGroupEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      sectionGroupId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const sectionGroupClass = new SectionGroup(req, res, conn);
    if (submit === 'status') {
      const sectionGroup = await sectionGroupClass.get(sectionGroupId);
      if (sectionGroup.status) {
        const data = {
          status: 0,
        };
        await sectionGroupClass.update(sectionGroupId, data);
      } else {
        const data = {
          status: 1,
        };
        await sectionGroupClass.update(sectionGroupId, data);
      }
    } else if (submit === 'edit') {
      const {
        type,
        viewOrder,
        title,
        content,
        showTitleAndContent,
      } = req.body;
      const data = {
        type,
        viewOrder,
        title,
        content,
        showTitleAndContent,
      };
      await sectionGroupClass.update(sectionGroupId, data);
    } else if (submit === 'delete') {
      await sectionGroupClass.remove(sectionGroupId);
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.sectionGroupDetail = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      sectionGroupId,
    } = req.params;
    const sectionGroupClass = new SectionGroup(req, res, conn);
    const sectionGroup = await sectionGroupClass.get(sectionGroupId);
    const sectionClass = new Section(req, res, conn);
    const sections = await sectionClass.getSections({ sectionGroupId });
    res.render('admin/sectionGroupDetail', {
      pageTitle: '첫페이지 상세설정',
      sections,
      sectionGroup,
    });
  } finally {
    conn.release();
  }
});


exports.sectionNew = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      sectionGroup,
      board,
      type,
      articleOrder,
    } = req.body;
    const sectionClass = new Section(req, res, conn);
    const data = {
      sectionGroupId: sectionGroup,
      board,
      type,
      articleOrder,
    };
    await sectionClass.create(data);
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.sectionEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      sectionId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const sectionClass = new Section(req, res, conn);
    if (submit === 'edit') {
      const {
        board,
        type,
        articleOrder,
        viewCount,
        viewOrder,
      } = req.body;
      const data = {
        board,
        type,
        articleOrder,
        viewCount,
        viewOrder,
      };
      await sectionClass.update(sectionId, data);
    } else if (submit === 'delete') {
      await sectionClass.remove(sectionId);
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.permission = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      method,
    } = req;
    if (method === 'GET') {
      const permissionClass = new Permission(req, res, conn);
      const permissions = await permissionClass.getPermissions();
      res.render('admin/permission', {
        pageTitle: '회원등급',
        permissions,
      });
    } else if (method === 'POST') {
      const {
        useAutoPermission,
        autoPermissionType,
        useManagerArticle,
      } = req.body;
      const data = {
        useAutoPermission,
        autoPermissionType,
        useManagerArticle,
      };
      const settingClass = new Setting(req, res, conn);
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '설정값 수정에 성공하였습니다',
      });
      res.redirect(req.headers.referer);
    }
  } finally {
    conn.release();
  }
});

exports.permissionNew = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      permission,
      title,
    } = req.body;
    const permissionClass = new Permission(req, res, conn);
    const permissionBoardClass = new PermissionBoard(req, res, conn);
    const data = {
      permission,
      title,
    };
    const permissionId = await permissionClass.create(data);
    await permissionBoardClass.create({
      permissionId,
    });
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.permissionEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      permissionId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const permissionClass = new Permission(req, res, conn);
    if (submit === 'edit') {
      const {
        title,
        pointBaseline,
        isManager,
        isAdmin,
      } = req.body;
      const { image } = req.files;
      if (image?.length) {
        // Delete Image
        const [result, ] = await conn.query(`SELECT * FROM permission WHERE id = ?`, [permissionId]);
        const oldKey = result[0].image;
        if (oldKey) {
          const params = {
            Bucket: bucket,
            Key: `permission/${oldKey}`,
          };
          s3.deleteObject(params, async (err, data) => {
            if (err) {
              console.error(err);
            }
          });
        }

        const key = await imageUpload({
          image: image[0],
          folder: 'permission',
        });
        const query = `UPDATE permission SET image = ? WHERE id = ?`;
        await conn.query(query, [key, permissionId]);
      }
      const data = {
        title,
        pointBaseline,
        isManager,
        isAdmin,
      };
      await permissionClass.update(permissionId, data);
    } else if (submit === 'delete') {
      await permissionClass.remove(permissionId);
    } else if (submit === 'resetImage') {
      // Delete Image
      const [result, ] = await conn.query(`SELECT * FROM permission WHERE id = ?`, [permissionId]);
      const key = result[0].image;
      if (key) {
        const params = {
          Bucket: bucket,
          Key: `permission/${key}`,
        };
        s3.deleteObject(params, async (err, data) => {
          if (err) {
            console.error(err);
          }
        });
      }
      await conn.query(`UPDATE permission SET image = ? WHERE id = ?`, [null, permissionId]);
      await permissionClass.set();
    }
    res.redirect('/admin/permission');
  } finally {
    conn.release();
  }
});

exports.asset = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      page,
    } = req.query;
    const pnQuery = `SELECT count(*) AS count FROM assets WHERE type='image'`;
    const [pnResult, ] = await conn.query(pnQuery);
    const pn = pagination(pnResult, req.query, 'page');
    const [assets, ] = await conn.query(`SELECT * FROM assets WHERE type='image' ORDER BY id DESC ${pn.queryLimit}`);
    res.render('admin/assets', {
      pageTitle: '에셋',
      assets,
      pn,
      page,
    });
  } finally {
    conn.release();
  }
});

exports.assetNew = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      type,
    } = req.body;
    const images = req.files.images;
    if (images?.length) {
      images.sort((a, b) => a.originalname.toLowerCase() < b.originalname.toLowerCase() ? -1 : 1);
      for await (let image of images) {
        const key = await imageUpload(image, 'assets');
        await conn.query(`INSERT INTO assets (type, image) VALUES (?, ?)`, [type, key]);
      }
      flash.create({
        status: true,
        message: '에셋 등록에 성공하였습니다',
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.assetEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      assetId,
    } = req.params;
    const [imageResult, ] = await conn.query(`SELECT * FROM assets WHERE id = ?`, [assetId]);
    if (imageResult.length) {
      const key = imageResult[0].image;
      const params = {
        Bucket: bucket,
        Key: `assets/${key}`,
      };
      s3.deleteObject(params, async (err, data) => {
        if (err) {
          console.error(err);
        }
      });
      await conn.query(`DELETE FROM assets WHERE id = ?`, [assetId]);
    }
    res.redirect('/admin/assets');
  } finally {
    conn.release();
  }
});

exports.go = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const goClass = new Go(req, res, conn);
    const { gos, pn } = await goClass.getGosByPagination();
    res.render('admin/go', {
      pageTitle: 'GO',
      gos,
      pn,
    });
  } finally {
    conn.release();
  }
});

exports.goNew = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      slug,
      url,
    } = req.body;
    const goClass = new Go(req, res, conn);
    const data = {
      slug,
      url,
    };
    await goClass.create(data);
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.goEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      goId,
    } = req.params;
    const {
      submit,
    } = req.body;
    const goClass = new Go(req, res, conn);
    if (submit === 'edit') {
      const { slug, url } = req.body;
      const data = {
        slug,
        url,
      };
      await goClass.update(goId, data);
    } else if (submit === 'delete') {
      await goClass.remove(goId);
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.check = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      method,
    } = req;
    if (method === 'GET') {
      const [checkContinues, ] = await conn.query(`SELECT * FROM checkContinue ORDER BY date ASC, id ASC`);
      res.render('admin/check', {
        pageTitle: `출석체크 - ${res.locals.setting.siteName}`,
        checkContinues,
      });
    } else if (method === 'POST') {
      const {
        checkPoint,
        useCheckComments,
        checkComments,
      } = req.body;
      const data = {
        checkPoint,
        useCheckComments,
        checkComments,
      };
      const settingClass = new Setting(req, res, conn);
      await settingClass.update(data);
      res.redirect(req.headers.referer);
    }
  } finally {
    conn.release();
  }
});

exports.checkNew = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      date,
      point,
    } = req.body;
    await conn.query(`INSERT INTO checkContinue (date, point) VALUES (?, ?)`, [
      date,
      point,
    ]);
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.checkEdit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      checkContinueId,
    } = req.params;
    const {
      date,
      point,
    } = req.body;
    const {
      submit,
    } = req.body;
    if (submit === 'edit') {
      await conn.query(`UPDATE checkContinue SET date = ?, point = ? WHERE id = ?`, [
        date,
        point,
        checkContinueId,
      ]);
    } else if (submit === 'delete') {
      await conn.query(`DELETE FROM checkContinue WHERE id = ?`, [
        checkContinueId,
      ]);
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

// Setting
exports.setting = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const settingClass = new Setting(req, res, conn);
    const setting = await settingClass.get();
    const customHeaders = cache.custom.headers;
    const customFooters = cache.custom.footers;
    const customIndexs = cache.custom.indexs;
    res.render('admin/setting', {
      pageTitle: `설정 - ${res.locals.setting.siteName}`,
      setting,
      customHeaders,
      customFooters,
      customIndexs,
    });
  } finally {
    conn.release();
  }
});

exports.settingBasic = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      siteNameRaw,
      siteName,
      siteDescription,
      siteKeywords,
      siteDomain,
    } = req.body;
    const data = {
      siteNameRaw,
      siteName,
      siteDescription,
      siteKeywords,
      siteDomain,
    };
    const settingClass = new Setting(req, res, conn);
    await settingClass.update(data);
    flash.create({
      status: true,
      message: '설정값 수정에 성공하였습니다',
    });
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingDomain = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      siteDomain,
    } = req.body;
    const data = {
      siteDomain,
    };
    const settingClass = new Setting(req, res, conn);
    await settingClass.update(data);
    flash.create({
      status: true,
      message: '설정값 수정에 성공하였습니다',
    });
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingCustomDesign = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      headerDesign,
      footerDesign,
    } = req.body;
    const data = {
      headerDesign,
      footerDesign,
    };
    const settingClass = new Setting(req, res, conn);
    await settingClass.update(data);
    flash.create({
      status: true,
      message: '설정값 수정에 성공하였습니다',
    });
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingIndexHeadTag = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      indexH1,
      indexH2,
    } = req.body;
    const data = {
      indexH1,
      indexH2,
    };
    const settingClass = new Setting(req, res, conn);
    await settingClass.update(data);
    flash.create({
      status: true,
      message: '설정값 수정에 성공하였습니다',
    });
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingEmail = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      emailService,
      gmailUser,
      gmailPassword,
    } = req.body;
    const data = {
      emailService,
      gmailUser,
      gmailPassword,
    };
    const settingClass = new Setting(req, res, conn);
    await settingClass.update(data);
    flash.create({
      status: true,
      message: '설정값 수정에 성공하였습니다',
    });
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingTemplate = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      headerTemplate,
      footerTemplate,
      mainTemplate,
    } = req.body;
    const data = {
      headerTemplate,
      footerTemplate,
      mainTemplate,
    };
    const settingClass = new Setting(req, res, conn);
    try {
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '설정값 수정에 성공하였습니다',
      });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingDesign = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      theme,
      logoType,
      logoImageDesktopSize,
      logoImageMobileSize,
    } = req.body;
    const data = {
      theme,
      logoType,
      logoImageDesktopSize,
      logoImageMobileSize,
    };
    const setting = res.locals.setting;
    if (req.files.logoImage) {
      if (setting.logoImage) {
        const params = {
          Bucket: bucket,
          Key: `assets/${setting.logoImage}`,
        };
        s3.deleteObject(params, (err, data) => {
          if (err) {
            console.error(err);
          }
        });
      }
      const image = req.files.logoImage[0] || null;
      const key = await imageUpload({
        image,
        folder: `assets`,
      });
      data.logoImage = key;
    }
    if (req.files.logoImageDarkMode) {
      if (setting.logoImageDarkMode) {
        const params = {
          Bucket: bucket,
          Key: `assets/${setting.logoImageDarkMode}`,
        };
        s3.deleteObject(params, (err, data) => {
          if (err) {
            console.error(err);
          }
        });
      }
      const image = req.files.logoImageDarkMode[0] || null;
      const key = await imageUpload({
        image,
        folder: `assets`,
      });
      data.logoImageDarkMode = key;
    }
    // Favicon
    if (req.files.faviconImage) {
      const faviconClass = new Favicon(req, res, conn);
      const faviconImage = req.files.faviconImage[0] || null;
      const key = await faviconClass.create(faviconImage);
      if (key) {
        data.faviconImage = key;
        if (setting.faviconImage) {
          faviconClass.remove(setting.faviconImage);
        }
      }
    }
    if (req.files.ogImage) {
      if (setting.ogImage) {
        const params = {
          Bucket: bucket,
          Key: `assets/${setting.ogImage}`,
        };
        s3.deleteObject(params, (err, data) => {
          if (err) {
            console.error(err);
          }
        });
      }
      const image = req.files.ogImage[0] || null;
      const key = await imageUpload({
        image,
        folder: `assets`,
      });
      data.ogImage = key;
    }
    const settingClass = new Setting(req, res, conn);
    try {
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '수정 완료',
      });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingEtcDesign = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      headerFontColor,
      headerBackgroundColor,
      bodyFontColor,
      bodyBackgroundColor,
      pointColor,
      pointBackgroundColor,
    } = req.body;
    const data = {
      headerFontColor,
      headerBackgroundColor,
      bodyFontColor,
      bodyBackgroundColor,
      pointColor,
      pointBackgroundColor,
    };
    const settingClass = new Setting(req, res, conn);
    try {
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '설정값 수정에 성공하였습니다',
      });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingBanner = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      desktopBannerRowsHeader,
      desktopBannerRowsIndexTop,
      desktopBannerRowsIndexBottom,
      desktopBannerRowsSideTop,
      desktopBannerRowsSideBottom,
      desktopBannerRowsArticleTop,
      desktopBannerRowsArticleBottom,
      desktopBannerRowsCustom,
      mobileBannerRowsHeader,
      mobileBannerRowsIndexTop,
      mobileBannerRowsIndexBottom,
      mobileBannerRowsSideTop,
      mobileBannerRowsSideBottom,
      mobileBannerRowsArticleTop,
      mobileBannerRowsArticleBottom,
      mobileBannerRowsCustom,
      bannerGapDesktop,
      bannerGapMobile,
      bannerBorderRounding,
    } = req.body;
    const data = {
      desktopBannerRowsHeader,
      desktopBannerRowsIndexTop,
      desktopBannerRowsIndexBottom,
      desktopBannerRowsSideTop,
      desktopBannerRowsSideBottom,
      desktopBannerRowsArticleTop,
      desktopBannerRowsArticleBottom,
      desktopBannerRowsCustom,
      mobileBannerRowsHeader,
      mobileBannerRowsIndexTop,
      mobileBannerRowsIndexBottom,
      mobileBannerRowsSideTop,
      mobileBannerRowsSideBottom,
      mobileBannerRowsArticleTop,
      mobileBannerRowsArticleBottom,
      mobileBannerRowsCustom,
      bannerGapDesktop,
      bannerGapMobile,
      bannerBorderRounding,
    };
    const settingClass = new Setting(req, res, conn);
    try {
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '설정값 수정에 성공하였습니다',
      });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingBoard = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      writingTerm,
      boardPrevNextArticle,
      boardAllArticle,
      boardAuthorArticle,
    } = req.body;
    const data = {
      boardPrevNextArticle,
      boardAllArticle,
      boardAuthorArticle,
      writingTerm,
    };
    const settingClass = new Setting(req, res, conn);
    try {
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '설정값 수정에 성공하였습니다',
      });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingCustomTags = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      customHeadTags,
      customHeaderTags,
      customFooterTags,
    } = req.body;
    const data = {
      customHeadTags,
      customHeaderTags,
      customFooterTags,
    };
    const settingClass = new Setting(req, res, conn);
    try {
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '설정값 수정에 성공하였습니다',
      });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingTermsAndPrivacy = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      terms,
      privacy,
    } = req.body;
    const data = {
      terms,
      privacy,
    };
    const settingClass = new Setting(req, res, conn);
    try {
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '설정값 수정에 성공하였습니다',
      });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingAdsense = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      adsenseIndexTop,
      adsenseIndexBottom,
      adsenseSide,
      adsenseCustom,
      adsenseArticleTop,
      adsenseArticleBottom,
      adsenseArticleCenter,
      adsenseAds,
    } = req.body;
    const data = {
      adsenseIndexTop,
      adsenseIndexBottom,
      adsenseSide,
      adsenseCustom,
      adsenseArticleTop,
      adsenseArticleBottom,
      adsenseArticleCenter,
      adsenseAds,
    };
    const settingClass = new Setting(req, res, conn);
    try {
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '설정값 수정에 성공하였습니다',
      });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingBlockWords = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      blockWords,
    } = req.body;
    const data = {
      blockWords,
    };
    const settingClass = new Setting(req, res, conn);
    try {
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '설정값 수정에 성공하였습니다',
      });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingJoinForm = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      useJoinPhone,
      useJoinRealName,
    } = req.body;
    const data = {
      useJoinPhone,
      useJoinRealName,
    };
    const settingClass = new Setting(req, res, conn);
    try {
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '설정값 수정에 성공하였습니다',
      });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingSocial = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      useSocialApple,
      useSocialGoogle,
      useSocialFacebook,
      useSocialTwitter,
      useSocialNaver,
      useSocialKakao,
      socialAppleServiceId,
      socialAppleTeamId,
      socialAppleKeyId,
      socialAppleAuthKey,
      socialGoogleClientId,
      socialGoogleClientSecret,
      socialFacebookAppId,
      socialFacebookAppSecret,
      socialTwitterApiKey,
      socialTwitterApiSecret,
      socialNaverClientId,
      socialNaverClientSecret,
      socialKakaoClientId,
      socialKakaoClientSecret,
    } = req.body;
    const data = {
      useSocialApple,
      useSocialGoogle,
      useSocialFacebook,
      useSocialTwitter,
      useSocialNaver,
      useSocialKakao,
      socialAppleServiceId,
      socialAppleTeamId,
      socialAppleKeyId,
      socialAppleAuthKey,
      socialGoogleClientId,
      socialGoogleClientSecret,
      socialFacebookAppId,
      socialFacebookAppSecret,
      socialTwitterApiKey,
      socialTwitterApiSecret,
      socialNaverClientId,
      socialNaverClientSecret,
      socialKakaoClientId,
      socialKakaoClientSecret,
    };
    const settingClass = new Setting(req, res, conn);
    try {
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '설정값 수정에 성공하였습니다',
      });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingSms = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      smsCallerId,
      smsServiceId,
      smsServiceSecretKey,
    } = req.body;
    const data = {
      smsCallerId,
      smsServiceId,
      smsServiceSecretKey,
    };
    const settingClass = new Setting(req, res, conn);
    try {
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '설정값 수정에 성공하였습니다',
      });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingApi = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      telegramToken,
      telegramChatId,
      naverCloudPlatformAccessKeyId,
      naverCloudPlatformSecretKey,
      googleCloudPlatformApiKey,
      kakaoJavascriptKey,
    } = req.body;
    const data = {
      telegramToken,
      telegramChatId,
      naverCloudPlatformAccessKeyId,
      naverCloudPlatformSecretKey,
      googleCloudPlatformApiKey,
      kakaoJavascriptKey,
    };
    const settingClass = new Setting(req, res, conn);
    try {
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '설정값 수정에 성공하였습니다',
      });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.settingEtc = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      useTermsAndPrivacy,
      useEmailAuthentication,
      useSmsAuthentication,
      useArticleViewCount,
      useVisitCount,
      useMessage,
      useChat,
      useSms,
      usePermissionImage,
      useWithdraw,
      withdrawType,
      useWorkingUser,
      usePointWithdraw,
      pointWithdrawLimit,
      joinPoint,
      invitePoint,
      reportCount,
      authorLikePoint,
      userLikePoint,
      articlePointLimit,
      commentPointLimit,
      authorLikePointLimit,
      userLikePointLimit,
      freePointTerm,
      freePoint,
    } = req.body;
    const settingClass = new Setting(req, res, conn);
    const data = {
      useTermsAndPrivacy,
      useEmailAuthentication,
      useSmsAuthentication,
      useArticleViewCount,
      joinPoint,
      invitePoint,
      useVisitCount,
      useMessage,
      useChat,
      useSms,
      usePermissionImage,
      useWithdraw,
      withdrawType,
      useWorkingUser,
      usePointWithdraw,
      pointWithdrawLimit,
      reportCount,
      authorLikePoint,
      userLikePoint,
      articlePointLimit,
      commentPointLimit,
      authorLikePointLimit,
      userLikePointLimit,
      freePointTerm,
      freePoint,
    };
    try {
      await settingClass.update(data);
      flash.create({
        status: true,
        message: '설정값 수정에 성공하였습니다',
      });
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.hidden = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      method,
    } = req;
    const settingClass = new Setting(req, res, conn);
    if (method === 'GET') {
      const setting = await settingClass.get();
      res.render('admin/hidden', {
        pageTitle: `히든설정 - ${res.locals.setting.siteName}`,
        setting,
      });
    } else if (method === 'POST') {
      const {
        index,
        useCustomLayout,
        mainLayout,
        headerLayout,
        footerLayout,
        indexLayout,
        license,
      } = req.body;
      const data = {
        index,
        useCustomLayout,
        mainLayout,
        headerLayout,
        footerLayout,
        indexLayout,
        license,
      };
      const settingClass = new Setting(req, res, conn);
      try {
        await settingClass.update(data);
        flash.create({
          status: true,
          message: '설정값 수정에 성공하였습니다',
        });
      } catch (e) {
        flash.create({
          status: false,
          message: e.message,
        });
      }
      res.redirect(req.headers.referer);
    }
  } finally {
    conn.release();
  }
});

exports.parsing = doAsync(async (req, res, next) => {
  const {
    method,
  } = req;
  if (method === 'GET') {
    let serverStatus = false;
    const parsingServer = res.locals.setting?.parsingServer;
    const parsingClass = new Parsing(req, res, null);
    if (parsingServer) {
      serverStatus = await parsingClass.getStatus();
    }
    const parsingSetting = await parsingClass.getSetting();
    const sites = await parsingClass.getSites();
    res.render('admin/parsing/site', {
      pageTitle: `파싱 - ${res.locals.setting.siteName}`,
      serverStatus,
      parsingSetting,
      sites,
    });
  } else if (method === 'POST') {
    const {
      server,
      proxies,
      useProxies,
    } = req.body;
    if (server) {
      const conn = await pool.getConnection();
      try {
        const settingClass = new Setting(req, res, conn);
        await settingClass.update({
          parsingServer: server,
        });
      } catch (e) {
        console.error(e);
      } finally {
        conn.release();
      }
    }
    if (proxies) {
      const parsingClass = new Parsing(req, res, null);
      await parsingClass.setSetting({
        proxies,
        useProxies,
      });
    }
    res.redirect(req.headers.referer);
  }
});

exports.parsingStart = doAsync(async (req, res, next) => {
  const parsingClass = new Parsing(req, res, null);
  const result = await parsingClass.start();
  res.redirect(req.headers.referer);
});

exports.parsingStop = doAsync(async (req, res, next) => {
  const parsingClass = new Parsing(req, res, null);
  const result = await parsingClass.stop();
  res.redirect(req.headers.referer);
});

exports.parsingSiteNew = doAsync(async (req, res, next) => {
  const {
    title,
    domain,
  } = req.body;
  const parsingClass = new Parsing(req, res, null);
  try {
    await parsingClass.createSite({
      title,
      domain,
    });
  } catch (e) {
    console.error(e);
    flash.create({
      status: false,
      message: e.message,
    });
  }
  res.redirect(req.headers.referer);
});

exports.parsingSiteEdit = doAsync(async (req, res, next) => {
  const {
    siteId,
  } = req.params;
  const {
    submit,
  } = req.body;
  const parsingClass = new Parsing(req, res, null);
  if (submit === 'edit') {
    const {
      title,
      domain,
      urlStructure,
      delay,
      viewOrder,
    } = req.body;
    try {
      await parsingClass.updateSite(siteId, {
        title,
        domain,
        urlStructure,
        delay,
        viewOrder,
      });
    } catch (e) {
      console.error(e);
      flash.create({
        status: false,
        message: e.message,
      });
    }
  } else if (submit === 'delete') {
    try {
      await parsingClass.removeSite(siteId);
    } catch (e) {
      console.error(e);
      flash.create({
        status: false,
        message: e.message,
      });
    }
  }
  res.redirect(req.headers.referer);
});

exports.parsingSiteDetail = doAsync(async (req, res, next) => {
  const {
    siteId,
  } = req.params;
  const parsingClass = new Parsing(req, res, null);
  const site = await parsingClass.getSite(siteId);
  res.render('admin/parsing/board', {
    pageTitle: `파싱 - ${res.locals.setting.siteName}`,
    site,
  });
});

exports.parsingBoardNew = doAsync(async (req, res, next) => {
  console.log(req.body);
  res.redirect(req.headers.referer);
});

exports.parsingBoardEdit = doAsync(async (req, res, next) => {
  console.log(req.body);
  res.redirect(req.headers.referer);
});