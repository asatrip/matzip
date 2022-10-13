const pool = require('../middleware/database');
const flash = require('../middleware/flash');
const datetime = require('../middleware/datetime');
const doAsync = require('../middleware/doAsync');
const Board = require('../services/board');
const Article = require('../services/article');
const Comment = require('../services/comment');
const Point = require('../services/point');
const UserGroupBoard = require('../services/userGroupBoard');
const UserBlockUser = require('../services/userBlockUser');
const PermissionBoard = require('../services/permissionBoard');
const Log = require('../services/log');
const Banner = require('../services/banner');
const cache = require('../services/cache');

exports.newArticles = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      searchType,
      keyword,
      page,
    } = req.query;
    const articleClass = new Article(req, res, conn);
    const { articles, pn } = await articleClass.getArticlesByPagination();
    res.render('board/all', {
      pageTitle: `전체게시글 - ${res.locals.setting.siteName}`,
      articles,
      page,
      searchType,
      keyword,
      pn,
      searchUrl: 'new',
    });
  } finally {
    conn.release();
  }
});

exports.best = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      searchType,
      keyword,
      page,
    } = req.query;
    const articleClass = new Article(req, res, conn);
    const data = {
      type: 'best',
    };
    const { articles, pn } = await articleClass.getArticlesByPagination(data);
    res.render('board/best', {
      pageTitle: `인기게시글 - ${res.locals.setting.siteName}`,
      title: '인기게시글',
      articles,
      page,
      searchType,
      keyword,
      pn,
      url: null,
      searchUrl: 'best',
    });
  } finally {
    conn.release();
  }
});

exports.bestTerm = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      searchType,
      keyword,
      page,
    } = req.query;
    const {
      term,
    } = req.params;
    if (term === 'day' || term === 'week' || term === 'month') {
      let type = null;
      let pageTitle = null;
      let title = null;
      let url = null;
      if (term === 'day') {
        type = 'bestDay';
        pageTitle = `일간 인기게시글 - ${res.locals.setting.siteName}`;
        title = `일간 인기게시글`;
        url = 'best/day';
      } else if (term === 'week') {
        type = 'bestWeek';
        pageTitle = `주간 인기게시글 - ${res.locals.setting.siteName}`;
        title = `주간 인기게시글`;
        url = 'best/week';
      } else if (term === 'month') {
        type = 'bestMonth';
        pageTitle = `월간 인기게시글 - ${res.locals.setting.siteName}`;
        title = `월간 인기게시글`;
        url = 'best/month';
      }
      const articleClass = new Article(req, res, conn);
      const data = {
        type,
      };
      const { articles, pn } = await articleClass.getArticlesByPagination(data);
      res.render('board/best', {
        type,
        pageTitle,
        title,
        articles,
        page,
        searchType,
        keyword,
        pn,
        searchUrl: `best/${term}`,
        url,
      });
    } else {
      next();
    }
  } finally {
    conn.release();
  }
});

exports.search = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      keyword,
      page,
    } = req.query;
    const searchType = 'titleAndContent';
    if (keyword) {
      const articleClass = new Article(req, res, conn);
      const { articles, pn } = await articleClass.getArticlesByPagination({
        searchType,
        keyword,
      });
      res.render('board/search', {
        pageTitle: `${keyword} - 검색결과 - ${res.locals.setting.siteName}`,
        articles,
        page,
        searchType,
        keyword,
        pn,
        searchUrl: 'search',
      });
    } else {
      const articles = [];
      res.render('board/search', {
        pageTitle: `키워드 없음 - ${res.locals.setting.siteName}`,
        articles,
        page,
        searchType,
        keyword,
        searchUrl: 'search',
      });
    }
  } finally {
    conn.release();
  }
});

exports.list = doAsync(async (req, res, next) => {
  const user = req.session.user;
  const {
    searchType,
    keyword,
    category,
    page,
  } = req.query;
  const {
    boardSlug,
  } = req.params;
  const board = res.locals.boards.find(board => board.slug === boardSlug);
  if (board) {
    const conn = await pool.getConnection();
    try {
      // TODO : Caching
      const userGroupBoardClass = new UserGroupBoard(req, res, conn);
      const userGroupListPermission = await userGroupBoardClass.check(board?.id, 'listPermission');
      if ((user?.permission >= board.listPermission || board.listPermission === 0) && (board.useUserGroupPermission && userGroupListPermission || !board.useUserGroupPermission) || user?.isAdmin) {
        const writePermission = user?.permission >= board.writePermission || board.writePermission === 0;
        const articleClass = new Article(req, res, conn);
        const { articles, pn } = await articleClass.getArticlesByPagination({
          board,
          searchType,
          keyword,
          category,
        });

        // Notice
        let notices = null;
        if (!searchType && (page === undefined || Number(page) === 1)) {
          board.notices.forEach(notice => notice.datetime = datetime(notice.createdAt));
          notices = board.notices;
        }
        
        // 한번만 사용 시
        

        // TODO : Caching
        // Block Users
        const userBlockUserClass = new UserBlockUser(req, res, conn);
        const blockUsers = await userBlockUserClass.getUsers(user?.id);
        articles.forEach(article => {
          const match = blockUsers.find(blockUser => blockUser.userBlockUser_targetUser_ID === article.article_user_ID);
          if (match) {
            article.block = true;
            article.title = `차단된 사용자의 글입니다`;
            article.nickName = '차단된 사용자';
            article.permissionName = null;
            article.permissionImage = null;
          }
        });

        // 로그 추가
        const logClass = new Log(req, res, conn);
        logClass.createUnsync({
          type: 'board',
          boardId: board.id,
        });

        res.render('board/list', {
          pageTitle: `${board.title} - ${res.locals.setting.siteNameRaw}`,
          board,
          articles,
          notices,
          pn,
          searchType,
          keyword,
          searchUrl: board.slug,
          writePermission,
        });
      } else {
        flash.create({
          status: false,
          message: '권한이 없습니다',
        });
        res.redirect('/login');
      }
    } finally {
      conn.release();
    }
  } else {
    next();
  }
});

exports.new = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      boardSlug,
    } = req.params;
    const user = req.session.user;
    const thisSite = res.locals;
    const board = thisSite.boards.find(board => board.slug === boardSlug);
    if (board) {
      const {
        method,
      } = req;
      if (method === 'GET') {
        const userGroupBoardClass = new UserGroupBoard(req, res, conn);
        const userGroupWritePermission = await userGroupBoardClass.check(board.id, 'writePermission');
        if ((user?.permission >= board.writePermission || board.writePermission === 0) && (board.useUserGroupPermission && userGroupWritePermission || !board.useUserGroupPermission) || user?.isAdmin) {
          if (req.cookies.writingTerm && !user?.isAdmin) {
            flash.create({
              status: false,
              message: `글쓰기는 ${thisSite.setting.writingTerm.toLocaleString()}초 마다 가능합니다`,
            });
            res.redirect(req.headers.referer);
          } else {
            const articleClass = new Article(req, res, conn);
            const articleId = await articleClass.createTemp({
              board,
              user,
            });
            if (board.useOnce) {
              const [onceCheckResult, ] = await conn.query(`SELECT * FROM article WHERE article_board_ID = ? AND article_user_ID = ? AND status = ?`, [
                board?.id,
                user?.id,
                2,
              ]);
              if (onceCheckResult.length && !user?.isAdmin) {
                flash.create({
                  status: false,
                  message: `${board.title} 게시판은 한번만 작성가능합니다`,
                });
                res.redirect(req.headers.referer);
              } else {
                if (thisSite.setting.editor === 'engine') {
                  res.render('board/editor/engine/new', {
                    pageTitle: `새글 - ${thisSite.setting.siteName}`,
                    board,
                    articleId,
                  });
                } else if (thisSite.setting.editor === 'ckeditor5') {
                  res.render('board/editor/ckeditor5/new', {
                    pageTitle: `새글 - ${thisSite.setting.siteName}`,
                    board,
                    articleId,
                  });
                }
              }
            } else {
              if (thisSite.setting.editor === 'engine') {
                res.render('board/editor/engine/new', {
                  pageTitle: `새글 - ${thisSite.setting.siteName}`,
                  board,
                  articleId,
                });
              } else if (thisSite.setting.editor === 'ckeditor5') {
                res.render('board/editor/ckeditor5/new', {
                  pageTitle: `새글 - ${thisSite.setting.siteName}`,
                  board,
                  articleId,
                });
              } else {
                next();
              }
            }
          }
        } else {
          flash.create({
            status: false,
            message: '권한이 없습니다',
          });
          res.redirect(req.headers.referer);
        }
      } else if (method === 'POST') {
        const {
          boardSlug,
        } = req.params;
        const {
          articleId,
        } = req.body;
        const board = thisSite.boards.find(board => board.slug === boardSlug);
        if (board) {
          const articleClass = new Article(req, res, conn);
          const article = await articleClass.get({
            id: articleId,
          });
          const {
            title,
            content,
            html,
            notice,
            category,
            tags,
            links,
            nickName,
            password,
            customField01,
            customField02,
            customField03,
            customField04,
            customField05,
            customField06,
            customField07,
            customField08,
            customField09,
            customField10,
          } = req.body;
          const files = req.files.files;
          const data = {
            board,
            boardId: board.id,
            categoryId: category,
            title,
            content,
            html,
            tags,
            notice,
            nickName,
            password,
            status: 2,
            customField01,
            customField02,
            customField03,
            customField04,
            customField05,
            customField06,
            customField07,
            customField08,
            customField09,
            customField10,
            updatedAt: new Date(),
            createdAt: new Date(),
            links,
            files,
          };
          const userGroupBoardClass = new UserGroupBoard(req, res, conn);
          const userGroupWritePermission = await userGroupBoardClass.check(board.id, 'writePermission');
          if (
            (
              user?.permission >= board.writePermission
              || board.writePermission === 0
            ) && (
              board.useUserGroupPermission && userGroupWritePermission
              || !board.useUserGroupPermission
            )
            || user?.isAdmin
          ) {
            if (thisSite.setting.editor === 'engine') {
              await articleClass.create(article.id, data);
              res.redirect(`/${boardSlug}/${articleId}`);
            } else if (thisSite.setting.editor === 'ckeditor5') {
              if (req.cookies.writingTerm && !user?.isAdmin) {
                flash.create({
                  status: false,
                  message: `글쓰기는 ${thisSite.setting.writingTerm.toLocaleString()}초 마다 가능합니다`,
                });
                res.redirect(req.headers.referer);
              } else {
                if (board.useOnce) {
                  const [onceCheckResult, ] = await conn.query(`SELECT * FROM article WHERE article_board_ID = ? AND article_user_ID = ? AND status = ?`, [
                    board.id,
                    user.id,
                    2,
                  ]);
                  if (onceCheckResult.length && !user?.isAdmin) {
                    flash.create({
                      status: false,
                      message: `${board.title} 게시판은 한번만 작성가능합니다`,
                    });
                    res.redirect(`/${boardSlug}/new`);
                  } else {
                    try {
                      const articleSlug = await articleClass.create(article.id, data);
                      flash.create({
                        status: true,
                        message: '등록 완료',
                      });
                      res.cookie('writingTerm', true, {
                        maxAge: setting.writingTerm * 1000,
                      });
                      res.redirect(`/${boardSlug}/${articleSlug}`);
                    } catch (e) {
                      console.error(e);
                      flash.create({
                        status: false,
                        message: e.message,
                      });
                      res.redirect(req.headers.referer);
                    }
                  }
                } else {
                  try {
                    const articleSlug = await articleClass.create(article.id, data);
                    flash.create({
                      status: true,
                      message: '등록 완료',
                    });
                    res.cookie('writingTerm', true, {
                      maxAge: thisSite.setting.writingTerm * 1000,
                    });
                    res.redirect(`/${boardSlug}/${articleSlug}`);
                  } catch (e) {
                    console.error(e);
                    flash.create({
                      status: false,
                      message: e.message,
                    });
                    res.redirect(req.headers.referer);
                  }
                }
              }
            }
          } else {
            next();
          }
        }
      } else {
        next();
      }
    } else {
      next();
    }
  } finally {
    conn.release();
  }
});

exports.pullUp = doAsync(async (req, res, next) => {
  const {
    boardSlug,
  } = req.params;
  const user = req.session.user;
  const boards = res.locals.boards;
  const board = boards.find(board => board.slug === boardSlug);
  if (board && board.useOnce) {
    const conn = await pool.getConnection();
    try {
      await conn.query(`UPDATE article SET updatedAt=NOW(), createdAt=NOW() WHERE article_board_ID = ? AND article_user_ID = ? AND status = ? ORDER BY createdAt DESC LIMIT 1`, [board.id, user.id, 2]);
      flash.create({
        status: true,
        message: '내 게시글을 끌어 올렸습니다',
      });
    } finally {
      conn.release();
    }
  }
  res.redirect(req.headers.referer);
});

exports.read = doAsync(async (req, res, next) => {
  const {
    category,
    page,
  } = req.query;
  const {
    boardSlug,
    articleSlug,
  } = req.params;
  const user = res.locals.user;
  const setting = res.locals.setting;
  const board = cache.boards.find(board => board.slug === boardSlug);
  if (board) {
    const conn = await pool.getConnection();
    try {
      const articleClass = new Article(req, res, conn);
      const article = await articleClass.get({
        slug: articleSlug,
      }, {
        status: 2,
        tags: true,
        userLike: true,
        boardPrevNextArticle: true,
        setInfo: true,
      });
      if (article) {
        cache.setArticle(article);
        // TODO : Caching
        const userGroupBoardClass = new UserGroupBoard(req, res, conn);
        const userGroupReadPermission = await userGroupBoardClass.check(board.id, 'readPermission');
        const userGroupCommentPermission = await userGroupBoardClass.check(board.id, 'commentPermission');
        if (
          (user?.permission >= board.readPermission || board.readPermission === 0) && (board.useUserGroupPermission && userGroupReadPermission || !board.useUserGroupPermission)
          || user?.isAdmin
        ) {
          const writePermission = user?.permission >= board.writePermission && board.writePermission === 0;
          const commentPermission = user?.permission >= board.commentPermission && (board.useUserGroupPermission && userGroupCommentPermission || !board.useUserGroupPermission) || user?.isAdmin;
          
          const commentClass = new Comment(req, res, conn);
          article.comments = await commentClass.getComments(article.id);
          if (!board.useSecret || board.useSecret && article.article_user_ID === user?.id || board.useSecret && user?.isAdmin || article.authorIsAdmin) {
            // 로그인 시 포인트 내역 조회
            const pointClass = new Point(req, res, conn);
            const readHistoryData = {
              user,
              type: 'read',
              articleId: article.id,
            };
            const readHistory = await pointClass.check(readHistoryData);
            // 포인트 체크
            if (!board.readPoint || article.article_user_ID === user?.id || readHistory || user?.point >= board.readPoint || board.readPoint === 0) {

              // 로그 추가
              const logClass = new Log(req, res, conn);
              logClass.createUnsync({
                type: 'article',
                articleId: article.id,
              });
              
              // 조회수 증가
              if (req.cookies[article.id] === undefined) {
                res.cookie(article.id, req.ip, {
                  maxAge: 600000,
                });
                articleClass.incrementViewCountUnsync(article.id);
              }
  
              // 포인트
              if (!readHistory && article.article_user_ID !== user?.id && !user?.isAdmin) {
                const data = {
                  user,
                  type: 'read',
                  point: board.readPoint,
                  boardId: board.id,
                  articleId: article.id,
                };
                await pointClass.remove(data);
              }

              // 이전글, 다음글
              if (setting.boardPrevNextArticle) {
                article.prevNextArticle = await articleClass.getPrevAfterArticle(article.id, board.id);
              }

              // 전체글
              if (setting.boardAllArticle) {
                const data = {
                  board,
                };
                const result = await articleClass.getArticlesByPagination(data);
                article.totalArticles = result.articles;
                article.pn = result.pn;
              }

              // 작성자의 다른 게시글
              if (setting.boardAuthorArticle) {
                
              }

              // Block Users
              // TODO : Caching
              const userBlockUserClass = new UserBlockUser(req, res, conn);
              const blockUsers = await userBlockUserClass.getUsers(user?.id);
              const match = blockUsers.find(blockUser => blockUser.userBlockUser_targetUser_ID === article.article_user_ID);
              if (match) {
                article.block = true;
                article.content = `차단된 사용자의 글입니다`;
              }
              article.comments.forEach(comment => {
                const commentMatch = blockUsers.find(blockUser => blockUser.userBlockUser_targetUser_ID === comment.comment_user_ID);
                if (commentMatch) {
                  comment.block = true;
                  comment.content = `차단된 사용자의 댓글입니다`;
                }
                comment.replies.forEach(reply => {
                  const replyMatch = blockUsers.find(blockUser => blockUser.userBlockUser_targetUser_ID === reply.comment_user_ID);
                  if (replyMatch) {
                    reply.block = true;
                    reply.content = `차단된 사용자의 댓글입니다`;
                  }
                });
              });
              
              const banners = cache.banners;
              const boardBanners = banners.filter(banner => banner.banner_board_ID === board.id);
              res.render('board/read', {
                pageTitle: `${article.title} - ${board.title} - ${res.locals.setting.siteName}`,
                article,
                writePermission,
                commentPermission,
                board,
                page,
                category,
                blockUsers,
                boardBanners,
              });
            } else {
              flash.create({
                status: false,
                message: '포인트가 부족합니다',
              });
              res.redirect(req.headers.referer);
            }
          } else {
            flash.create({
              status: false,
              message: '비밀글은 작성자와 관리자만 열람 가능합니다',
            });
            res.redirect(req.headers.referer);
          }
        } else { // 권한 없음
          flash.create({
            status: false,
            message: '권한이 없습니다',
          });
          res.redirect('/login');
        }
      } else {
        next();
      }
    } finally {
      conn.release();
    }
  } else {
    next();
  }
});

exports.edit = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      boardSlug,
      articleSlug,
    } = req.params;
    const user = req.session.user;
    const thisSite = res.locals;
    const board = thisSite.boards.find(board => board.slug === boardSlug);
    if (board) {
      const {
        method,
      } = req;
      if (method === 'GET') {
        const conn = await pool.getConnection();
        try {
          const articleClass = new Article(req, res, conn);
          const article = await articleClass.get({
            slug: articleSlug,
          }, {
            tags: true,
            setInfo: true,
          });
          if (article) {
            if (thisSite.setting.editor === 'engine') {
              res.render('board/editor/engine/edit', {
                pageTitle: `글수정 - ${thisSite.setting.siteName}`,
                board,
                article,
              });
            } else if (thisSite.setting.editor === 'ckeditor5') {
              res.render('board/editor/ckeditor5/edit', {
                pageTitle: `글수정 - ${thisSite.setting.siteName}`,
                board,
                article,
              });
            }
          } else {
            next();
          }
        } finally {
          conn.release();
        }
      } else if (method === 'POST') {
        const conn = await pool.getConnection();
        try {
          const {
            password,
          } = req.body;
          const articleClass = new Article(req, res, conn);
          const article = await articleClass.get({
            slug: articleSlug,
          });
          if (article) {
            if (
              board.writePermission
              || board.writePermission === 0 && password
              || user?.isAdmin
            ) {
              const data = {
                password,
              };
              try {
                await articleClass.remove({
                  slug: articleSlug,
                }, data);
                flash.create({
                  status: true,
                  message: '게시글을 삭제하였습니다',
                });
                res.redirect(`/${boardSlug}`);
              } catch (e) {
                console.log(e);
                flash.create({
                  status: false,
                  message: e.message,
                });
                res.redirect(req.headers.referer);
              }
            } else {
              flash.create({
                status: false,
                message: `비밀번호를 입력하여야 합니다`,
              });
              res.redirect(req.headers.referer);
            }
          } else {
            next();
          }
        } finally {
          conn.release();
        }
      } else {
        next();
      }
    } else {
      next();
    }
  } finally {
    conn.release();
  }
});

exports.update = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      boardSlug,
      articleSlug,
    } = req.params;
    const {
      title,
      content,
      html,
      notice,
      category,
      tags,
      links,
      nickName,
      password,
      customField01,
      customField02,
      customField03,
      customField04,
      customField05,
      customField06,
      customField07,
      customField08,
      customField09,
      customField10,
    } = req.body;
    const articleClass = new Article(req, res, conn);
    const files = req.files.files;
    const data = {
      title,
      content,
      html,
      tags,
      notice,
      nickName,
      password,
      categoryId: category,
      customField01,
      customField02,
      customField03,
      customField04,
      customField05,
      customField06,
      customField07,
      customField08,
      customField09,
      customField10,
      updatedAt: new Date(),
      links,
      files,
    };
    try {
      await articleClass.update({
        slug: articleSlug,
      }, data);
      res.redirect(`/${boardSlug}/${articleSlug}`);
    } catch (e) {
      flash.create({
        status: false,
        message: e.message,
      });
      res.redirect(req.headers.referer);
    }
  } finally {
    conn.release();
  }
});

exports.page = doAsync(async (req, res, next) => {
  const {
    pageSlug,
  } = req.params;
  const page = cache.pages.find(page => page.slug === pageSlug);
  if (page) {
    res.render('page', {
      pageTitle: `${page.title} - ${res.locals.setting.siteName}`,
      page,
    });
  } else {
    next();
  }
});