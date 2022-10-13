const { timezone } = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault(timezone);
const pool = require('../middleware/database');
const flash = require('../middleware/flash');
const hashCreate = require('../middleware/hash');
const datetime = require('../middleware/datetime');
const doAsync = require('../middleware/doAsync');
const emptyCheck = require('../middleware/emptyCheck');
const shuffle = require('../middleware/shuffle');
const Section = require('../services/section');
const User = require('../services/user');
const Go = require('../services/go');
const Article = require('../services/article');
const Email = require('../services/email');
const Phone = require('../services/phone');
const Point = require('../services/point');
const Log = require('../services/log');
const {
  AppleLogin,
  GoogleLogin,
  FacebookLogin,
  TwitterLogin,
  NaverLogin,
  KakaoLogin,
} = require('../services/socialLogin');
const cache = require('../services/cache');

exports.authApple = doAsync(async (req, res, next) => {
  try {
    const apple = new AppleLogin(req, res, null);
    const appleAuthUrl = apple.getLoginUrl();
    res.redirect(appleAuthUrl);
  } catch (e) {
    console.error(e);
    res.redirect('/login');
  }
});

exports.authGoogle = doAsync(async (req, res, next) => {
  try {
    const google = new GoogleLogin(req, res, null);
    const googleAuthUrl = google.getLoginUrl();
    res.redirect(googleAuthUrl);
  } catch (e) {
    console.error(e);
    res.redirect('/login');
  }
});

exports.authFacebook = doAsync(async (req, res, next) => {
  try {
    const facebook = new FacebookLogin(req, res, null);
    const facebookAuthUrl = facebook.getLoginUrl();
    res.redirect(facebookAuthUrl);
  } catch (e) {
    console.error(e);
    res.redirect('/login');
  }
});

exports.authTwitter = doAsync(async (req, res, next) => {
  try {
    const twitter = new TwitterLogin(req, res, null);
    const twitterAuthUrl = await twitter.getLoginUrl();
    res.redirect(twitterAuthUrl);
  } catch (e) {
    console.error(e);
    res.redirect('/login');
  }
});

exports.authNaver = doAsync(async (req, res, next) => {
  try {
    const naver = new NaverLogin(req, res, null);
    const naverAuthUrl = naver.getLoginUrl();
    res.redirect(naverAuthUrl);
  } catch (e) {
    console.error(e);
    res.redirect('/login');
  }
});

exports.authKakao = doAsync(async (req, res, next) => {
  try {
    const kakao = new KakaoLogin(req, res, null);
    const kakaoAuthUrl = kakao.getLoginUrl();
    res.redirect(kakaoAuthUrl);
  } catch (e) {
    console.error(e);
    res.redirect('/login');
  }
});

exports.authAppleCallback = doAsync(async (req, res, next) => {
  const {
    code,
  } = req.body;
  if (code) {
    const conn = await pool.getConnection();
    try {
      const apple = new AppleLogin(req, res, conn);
      const authData = await apple.auth(code);
      try {
        const userClass = new User(req, res, conn);
        const { user, type } = await userClass.authCheckout(authData);
        if (user) {
          req.session.user = user;
          req.session.save(async () => {
            if (type === 'join') {
              const pointClass = new Point(req, res, conn);
              await pointClass.create({
                user,
                type: 'join',
                point: res.locals.setting.joinPoint,
                force: true,
              });
            }
            res.redirect('/');
          });
        } else {
          res.redirect('/login');
        }
      } catch (e) {
        console.error(e);
        flash.create({
          status: false,
          message: e.message,
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

exports.authGoogleCallback = doAsync(async (req, res, next) => {
  const {
    code,
  } = req.query;
  if (code) {
    const conn = await pool.getConnection();
    try {
      const google = new GoogleLogin(req, res, conn);
      const authData = await google.auth(code);
      try {
        const userClass = new User(req, res, conn);
        const { user, type } = await userClass.authCheckout(authData);
        if (user) {
          req.session.user = user;
          req.session.save(async () => {
            if (type === 'join') {
              const pointClass = new Point(req, res, conn);
              await pointClass.create({
                user,
                type: 'join',
                point: res.locals.setting.joinPoint,
                force: true,
              });
            }
            res.redirect('/');
          });
        } else {
          res.redirect('/login');
        }
      } catch (e) {
        console.error(e);
        flash.create({
          status: false,
          message: e.message,
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

exports.authFacebookCallback = doAsync(async (req, res, next) => {
  const {
    code,
  } = req.query;
  if (code) {
    const conn = await pool.getConnection();
    try {
      const facebook = new FacebookLogin(req, res, conn);
      const authData = await facebook.auth(code);
      try {
        const userClass = new User(req, res, conn);
        const { user, type } = await userClass.authCheckout(authData);
        if (user) {
          req.session.user = user;
          req.session.save(async () => {
            if (type === 'join') {
              const pointClass = new Point(req, res, conn);
              await pointClass.create({
                user,
                type: 'join',
                point: res.locals.setting.joinPoint,
                force: true,
              });
            }
            res.redirect('/');
          });
        } else {
          res.redirect('/login');
        }
      } catch (e) {
        console.error(e);
        flash.create({
          status: false,
          message: e.message,
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

exports.authTwitterCallback = doAsync(async (req, res, next) => {
  const {
    oauth_verifier,
  } = req.query;
  if (oauth_verifier) {
    const conn = await pool.getConnection();
    try {
      const twitter = new TwitterLogin(req, res, conn);
      const authData = await twitter.auth(req, oauth_verifier);
      try {
        const userClass = new User(req, res, conn);
        const { user, type } = await userClass.authCheckout(authData);
        if (user) {
          req.session.user = user;
          req.session.save(async () => {
            if (type === 'join') {
              const pointClass = new Point(req, res, conn);
              await pointClass.create({
                user,
                type: 'join',
                point: res.locals.setting.joinPoint,
                force: true,
              });
            }
            res.redirect('/');
          });
        } else {
          res.redirect('/login');
        }
      } catch (e) {
        console.error(e);
        flash.create({
          status: false,
          message: e.message,
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

exports.authNaverCallback = doAsync(async (req, res, next) => {
  const {
    code,
    state,
  } = req.query;
  if (code && state) {
    const conn = await pool.getConnection();
    try {
      const naver = new NaverLogin(req, res, conn);
      const authData = await naver.auth(code, state);
      try {
        const userClass = new User(req, res, conn);
        const { user, type } = await userClass.authCheckout(authData);
        if (user) {
          req.session.user = user;
          req.session.save(async () => {
            if (type === 'join') {
              const pointClass = new Point(req, res, conn);
              await pointClass.create({
                user,
                type: 'join',
                point: res.locals.setting.joinPoint,
                force: true,
              });
            }
            res.redirect('/');
          });
        } else {
          res.redirect('/login');
        }
      } catch (e) {
        console.error(e);
        flash.create({
          status: false,
          message: e.message,
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

exports.authKakaoCallback = doAsync(async (req, res, next) => {
  const {
    code,
  } = req.query;
  if (code) {
    const conn = await pool.getConnection();
    try {
      const kakao = new KakaoLogin(req, res, conn);
      const authData = await kakao.auth(code);
      try {
        const userClass = new User(req, res, conn);
        const { user, type } = await userClass.authCheckout(authData);
        if (user) {
          req.session.user = user;
          req.session.save(async () => {
            if (type === 'join') {
              const pointClass = new Point(req, res, conn);
              await pointClass.create({
                user,
                type: 'join',
                point: res.locals.setting.joinPoint,
                force: true,
              });
            }
            res.redirect('/');
          });
        } else {
          res.redirect('/login');
        }
      } catch (e) {
        console.error(e);
        flash.create({
          status: false,
          message: e.message,
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

exports.emailAuthentication = doAsync(async (req, res, next) => {
  const {
    method,
  } = req;
  if (method === 'GET') {
    const user = res.locals.user;
    if (user && res.locals.setting.useEmailAuthentication && !user.emailAuthentication && !user.isAdmin && !user.workingUser) {
      res.render('emailAuthentication', {
        pageTitle: `이메일 인증 - ${res.locals.setting.siteName}`,
      });
    } else {
      if (req.headers.referer && !req.headers.referer.match(/emailAuthentication/)) {
        res.redirect(req.headers.referer);
      } else {
        res.redirect('/');
      }
    }
  } else if (method === 'POST') {
    const {
      gmailUser,
    } = res.locals.setting;
    if (gmailUser) {
      const conn = await pool.getConnection();
      try {
        const { submit } = req.body;
        const user = req.session.user;
        if (submit === 'authentication') {
          const { hash } = req.body;
          const [check, ] = await conn.query(`SELECT * FROM authentication WHERE authentication_user_ID = ? AND type = ?`, [user.id, 'email']);
          if (check.length) {
            if (hash === check[0].hash) {
              await conn.query(`DELETE FROM authentication WHERE authentication_user_ID = ? AND type = ?`, [user.id, 'email']);
              await conn.query(`UPDATE user SET emailAuthentication = ? WHERE id = ?`, [1, user.id]);
              const userClass = new User(req, res, conn);
              const newUser = await userClass.get({ id: user.id });
              req.session.user = newUser;
              req.session.save(() => {
                res.redirect(req.headers.referer);
              });
            } else {
              flash.create({
                status: false,
                message: '인증번호가 틀립니다',
              });
              res.redirect('/emailAuthentication');
            }
          } else {
            flash.create({
              status: false,
              message: '인증번호가 틀립니다',
            });
            res.redirect(req.headers.referer);
          }
        } else if (submit === 'emailResend') {
          const hash = hashCreate(8);
          const [oldHash, ] = await conn.query(`SELECT * FROM authentication WHERE authentication_user_ID = ? AND type = ?`, [user.id, 'email']);
          if (oldHash.length) await conn.query(`DELETE FROM authentication WHERE authentication_user_ID = ? AND type = ?`, [user.id, 'email']);
          await conn.query(`INSERT INTO authentication (authentication_user_ID, type, hash) VALUES (?, ?, ?)`, [user.id, 'email', hash]);
          const emailClass = new Email(req, res, conn);
          try {
            emailClass.create(user.email, {
              subject: `이메일 인증 - ${res.locals.setting.siteName}`,
              content: `
              <h1>이메일 인증 - ${res.locals.setting.siteName}</h1>
              <hr>
              <p>${user.nickName} 님의 이메일 인증번호</p><p style="font-weight: bold;">${hash}</p>`,
            });
            flash.create({
              status: true,
              message: '이메일이 발송되었습니다',
            });
          } catch (e) {
            flash.create({
              status: false,
              message: e.message,
            });
          }
          res.redirect('/emailAuthentication');
        }
      } finally {
        conn.release();
      }
    } else {
      flash.create({
        status: false,
        message: '해당 사이트의 이메일 설정이 되어있지 않습니다',
      });
      res.redirect(req.headers.referer);
    }
  } else {
    next();
  }
});

exports.smsAuthentication = doAsync(async (req, res, next) => {
  const {
    method,
  } = req;
  if (method === 'GET') {
    if (res.locals.user && res.locals.setting.useSmsAuthentication && !res.locals.user.phoneAuthentication && !res.locals.user.isAdmin && !res.locals.user.workingUser) {
      res.render('smsAuthentication', {
        pageTitle: `SMS 인증 - ${res.locals.setting.siteName}`,
      });
    } else {
      if (req.headers.referer && !req.headers.referer.match(/smsAuthentication/)) {
        res.redirect(req.headers.referer);
      } else {
        res.redirect('/');
      }
    }
  } else if (method === 'POST') {
    const conn = await pool.getConnection();
    try {
      const {
        submit,
      } = req.body;
      const user = res.locals.user;
      if (submit === 'authentication') {
        const {
          hash,
        } = req.body;
        const [check, ] = await conn.query(`SELECT * FROM authentication WHERE authentication_user_ID = ? AND type = ? ORDER BY id DESC`, [user.id, 'sms']);
        if (check.length) {
          if (hash === check[0].hash) {
            await conn.query(`DELETE FROM authentication WHERE authentication_user_ID = ? AND type = ?`, [user.id, 'email']);
            await conn.query(`UPDATE user SET phoneAuthentication = ? WHERE id = ?`, [1, user.id]);
            if (req.headers.referer && !req.headers.referer.match(/smsAuthentication/)) {
              res.redirect(`${req.headers.referer}`);
            } else {
              res.redirect('/');
            }
          } else {
            flash.create({
              status: false,
              message: '인증번호가 틀립니다',
            });
            res.redirect('/smsAuthentication');
          }
        }
      } else if (submit === 'smsResend') {
        const verifyNumber = Math.random().toString().slice(3, 7);
        const query = `INSERT INTO authentication
        (authentication_user_ID, type, hash)
        VALUES (?, ?, ?)`;
        await conn.query(query, [user.id, 'sms', verifyNumber]);
        const phoneClass = new Phone(req, res, conn);
        await phoneClass.create(user.phone, `[${res.locals.setting.siteNameRaw}] 인증번호는 ${verifyNumber} 입니다`);
        flash.create({
          status: true,
          message: 'SMS가 발송되었습니다',
        });
        res.redirect('/smsAuthentication');
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

exports.index = doAsync(async (req, res, next) => {
  const index = res.locals.setting.index;
  if (index === 'basic') {
    const conn = await pool.getConnection();
    try {
      
      // 인덱스 섹션
      const sectionClass = new Section(req, res, conn);
      const indexSectionGroups = cache.sectionGroups.filter(sectionGroup => sectionGroup.type !== 'side')
      for await (let sectionGroup of indexSectionGroups) {
        for await (let section of sectionGroup.sections) {
          section.articles = await sectionClass.getSectionArticles(section.id, {
            boardId: section.section_board_ID,
            articleOrder: section.articleOrder,
            viewCount: section.viewCount,
          });
        }
      }

      // 로그 추가
      const logClass = new Log(req, res, conn);
      logClass.createUnsync({
        type: 'index',
      });

      // 팝업 배너
      let banners = cache.banners;
      if (req.cookies['blockBanners']) {
        const blockBanners = JSON.parse(req.cookies['blockBanners']);
        banners = cache.banners.filter(banner => !blockBanners.includes(`${banner.id}`));
      }

      res.render('index', {
        pageTitle: `${res.locals.setting.siteName}`,
        indexSectionGroups,
        banners,
      });
    } finally {
      conn.release();
    }
  } else {
    next();
  }
});

exports.go = doAsync(async (req, res, next) => {
  const {
    slug,
  } = req.params;
  const go = cache.gos.find(go => go.slug === slug);
  if (go) {
    res.redirect(go.url);
  } else {
    next();
  }
});

exports.terms = doAsync(async (req, res, next) => {
  const terms = cache.setting.terms?.replaceAll('\r\n', '<br>');
  res.render('terms', {
    pageTitle: `이용약관 - ${res.locals.setting.siteName}`,
    terms,
  });
});

exports.privacy = doAsync(async (req, res, next) => {
  const privacy = cache.setting.privacy?.replaceAll('\r\n', '<br>');
  res.render('privacy', {
    pageTitle: `개인정보보호 정책 - ${res.locals.setting.siteName}`,
    privacy,
  });
});

exports.changeUser = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      method,
    } = req;
    if (method === 'GET') {
      const query = `SELECT *
      FROM user
      WHERE workingUser = 1`;
      const [users, ] = await conn.query(query);
      if (users.length > 1) {
        const existingUser = res.locals.user;
        let random = Math.floor(Math.random() * users.length);
        let newUser = null;
        do {
          random = Math.floor(Math.random() * users.length);
          newUser = users[random];
        } while (existingUser.id === newUser.id);
        const userClass = new User(req, res, conn);
        req.session.user = await userClass.get({ id: users[random].id });
        req.session.save(() => {
          // res.redirect(req.headers.referer);
        });
      }
    } else if (method === 'POST') {
      const {
        keyword,
      } = req.body;
      const query = `SELECT u.*
      FROM user AS u
      LEFT JOIN permission AS p
      ON u.permission = p.permission
      WHERE u.workingUser = 1 AND u.nickName LIKE CONCAT('%',?,'%')
      OR p.isAdmin AND u.nickName LIKE CONCAT('%',?,'%')`;
      const [users,] = await conn.query(query, [
        keyword,
        keyword,
        keyword,
        keyword,
      ]);
      if (users.length) {
        const selectUser = users[0];
        const userClass = new User(req, res, conn);
        const user = await userClass.get({ id: selectUser.id });
        req.session.user = user;
        req.session.save(() => {
          // res.redirect(req.headers.referer);
        });
      }
    } else {
      next();
    }
    res.redirect(req.headers.referer);
  } finally {
    conn.release();
  }
});

exports.login = doAsync(async (req, res, next) => {
  const {
    method,
  } = req;
  if (method === 'GET') {
    if (res.locals.user) {
      res.redirect('/');
    } else {
      res.render('login', {
        pageTitle: `로그인 - ${res.locals.setting.siteName}`,
      });
    }
  } else if (method === 'POST') {
    const conn = await pool.getConnection();
    try {
      const {
        email,
        password,
      } = req.body;
      const data = {
        email,
        password,
      };
      const userClass = new User(req, res, conn);
      try {
        const user = await userClass.login(data);
        if (user) {
          req.session.user = user;
          req.session.save(() => {
            res.redirect(req.headers.referer);
          });
        }
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
  } else {
    next();
  }
});

exports.logout = doAsync(async (req, res, next) => {
  req.session.destroy(() => {
    res.redirect(req.headers.referer);
  });
});

exports.join = doAsync(async (req, res, next) => {
  const {
    method,
  } = req;
  if (method === 'GET') {
    res.render('join', {
      pageTitle: `회원가입 - ${res.locals.setting.siteName}`,
    });
  } else if (method === 'POST') {
    const conn = await pool.getConnection();
    const setting = res.locals.setting;
    try {
      const {
        email,
        password,
        passwordCheck,
        nickName,
        phone,
        realName,
        inviteId,
      } = req.body;
      if (emptyCheck(email, password, passwordCheck, nickName)) {
        if (password === passwordCheck) {
          const userClass = new User(req, res, conn);
          const data = {
            email,
            password,
            nickName,
            phone,
            realName,
            inviteId,
          };
          const user = await userClass.create(data);
          if (user) {
            await userClass.checkout(user);
            req.session.user = user;
            req.session.save(async () => {
              const pointClass = new Point(req, res, conn);
              await pointClass.create({
                user,
                type: 'join',
                point: setting.joinPoint,
                force: true,
              });
              res.redirect('/');
            });
          }
        } else {
          res.redirect('/join');
        }
      } else {
        res.redirect('/join');
      }
    } finally {
      conn.release();
    }
  } else {
    next();
  }
});

// 출석체크
exports.check = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      method,
    } = req;
    const user = res.locals.user;
    const setting = res.locals.setting;
    if (method === 'GET') {
      const {
        date,
      } = req.query;
      const today = date || datetime(Date.now(), 'date');
      const yesterday = moment(today).subtract(1, 'days').format('YYYY-MM-DD');
      const tomorrow = moment(today).subtract(-1, 'days').format('YYYY-MM-DD');
      const now = datetime(Date.now(), 'date');
      const query = `SELECT c.*, u.nickName, u.checkContinue AS \`continue\`, u.checkTotal AS total
      FROM \`check\` AS c
      LEFT JOIN user AS u
      ON c.check_user_ID = u.id
      WHERE date_format(CONVERT_TZ(c.createdAt, @@session.time_zone, '+09:00'), '%Y-%m-%d') = ?
      ORDER BY c.id ASC`;
      const [checks, ] = await conn.query(query, today);
      let i = 1;
      checks.forEach(check => {
        check.datetime = datetime(check.createdAt, 'time');
        check.number = i;
        i ++;
      });
      checks.reverse();
      const [checkContinues, ] = await conn.query(`SELECT * FROM checkContinue ORDER BY date ASC`);
      let status = false;
      if (user) {
        const statusQuery = `SELECT c.*
        FROM \`check\` AS c
        LEFT JOIN user AS u
        ON c.check_user_ID = u.id
        WHERE date_format(CONVERT_TZ(c.createdAt, @@session.time_zone, '+09:00'), '%Y-%m-%d') = ?
        AND c.check_user_ID = ?
        ORDER BY c.id DESC`;
        const [checkStatusResult, ] = await conn.query(statusQuery, [today, user.id]);
        if (checkStatusResult.length) {
          status = true;
        }
      }
      // 자동 인사말
      let checkComment = null;
      if (setting.useCheckComments) {
        const checkComments = setting.checkComments;
        const checkCommentsArray = checkComments ? checkComments.split(',').map(comment => comment.trim()).filter(comment => comment.length) : [];
        if (checkCommentsArray.length) {
          checkComment = shuffle(checkCommentsArray)[0];
        }
      }
      res.render('check', {
        pageTitle: `출석체크 - ${res.locals.setting.siteName}`,
        today,
        yesterday,
        tomorrow,
        now,
        checks,
        checkContinues,
        checkComment,
        status,
      });
    } else if (method === 'POST') {
      const {
        comment,
      } = req.body;
      const checkPoint = res.locals.setting.checkPoint;
      const user = res.locals.user;
      if (user) {
        const today = datetime(Date.now(), 'date');
        const query = `SELECT c.*
        FROM \`check\` AS c
        LEFT JOIN user AS u
        ON c.check_user_ID = u.id
        WHERE date_format(CONVERT_TZ(c.createdAt, @@session.time_zone, '+09:00'), '%Y-%m-%d') = ?
        AND c.check_user_ID = ?
        ORDER BY c.id DESC`;
        const [checks, ] = await conn.query(query, [today, user?.id]);
        if (!checks.length) {
          let point = checkPoint;
          const yesterday = moment(Date.now()).subtract('1', 'days').format('YYYY-MM-DD');
          const yesterdayQuery = `SELECT c.*
          FROM \`check\` AS c
          LEFT JOIN user AS u
          ON c.check_user_ID = u.id
          WHERE date_format(CONVERT_TZ(c.createdAt, @@session.time_zone, '+09:00'), '%Y-%m-%d') = ?
          AND c.check_user_ID = ?
          ORDER BY c.id DESC`;
          const [yesterdayResult, ] = await conn.query(yesterdayQuery, [yesterday, user.id]);
          // 개근일 경우
          if (yesterdayResult.length) {
            const userContinue = user.checkContinue + 1;
            await conn.query(`UPDATE user SET checkContinue=checkContinue+1 WHERE id = ?`, [user.id]);
            const [checkContinues, ] = await conn.query(`SELECT * FROM checkContinue ORDER BY date ASC`);
            let thisContinues = checkContinues.filter(checkContinue => checkContinue.date === userContinue);
            // 연속 지급 방식
            if (thisContinues.length) {
              const thisContainue = thisContinues[0];
              point = thisContainue.point;
            } else {
              thisContinues = checkContinues.filter(checkContinue => checkContinue.date < userContinue);
              const thisContainue = thisContinues[thisContinues.length - 1];
              if (thisContainue) {
                point = thisContainue.point;
              }
            }
          } else {
            // 개근이 아닐 경우
            await conn.query(`UPDATE user SET checkContinue = ? WHERE id = ?`, [1, user.id]);
          }
          // 출석 등록
          await conn.query(`INSERT INTO \`check\` (check_user_ID, comment, point) VALUES (?, ?, ?)`, [
            user.id,
            comment,
            point,
          ]);
          // 포인트 지급 & 총 출석일 + 1
          const userClass = new User(req, res, conn);
          const pointClass = new Point(req, res, conn);
          await userClass.update(user.id, {
            checkTotal: user.checkTotal + 1,
          });
          await pointClass.create({
            user,
            type: 'check',
            point: point,
          });
          // 개근
          flash.create({
            status: true,
            message: '출석체크 완료',
          });
        } else {
          flash.create({
            status: false,
            message: '오늘은 이미 출석체크 하였습니다',
          });
        }
      } else {
        flash.create({
          status: false,
          message: '로그인이 필요합니다',
        });
      }
      res.redirect(req.headers.referer);
    } else {
      next();
    }
  } finally {
    conn.release();
  }
});

exports.findInfo = doAsync(async (req, res, next) => {
  const {
    method,
  } = req;
  const thisSite = res.locals;
  if (method === 'GET') {
    res.render('findInfo', {
      pageTitle: `비밀번호 찾기 - ${thisSite.setting.siteName}`,
    });
  } else if (method === 'POST') {
    const {
      email,
    } = req.body;
    const emailSetting = thisSite.setting.gmailUser && thisSite.setting.gmailPassword;
    if (emailSetting) {
      if (email) {
        const conn = await pool.getConnection();
        try {
          const userClass = new User(req, res, conn);
          const user = await userClass.get({
            email,
          });
          if (user) {
            const authCode = Math.random().toString().slice(3, 7);
            await userClass.update(user.id, {
              authCode,
            });
            const emailClass = new Email(req, res, conn);
            try {
              emailClass.create(email, {
                subject: `인증 코드 - ${thisSite.setting.siteName}`,
                content: `
                <h1>새 인증 코드 - ${authCode}</h1>
                `,
              });
              flash.create({
                status: true,
                message: '인증번호가 발송되었습니다',
              });
              req.session.email = email;
              res.redirect('/findInfo/checkout');
            } catch (e) {
              flash.create({
                status: false,
                message: e.message,
              });
              res.redirect(req.headers.referer);
            }
          } else {
            flash.create({
              status: false,
              message: '가입된 이메일이 없습니다',
            });
            res.redirect(req.headers.referer);
          }
        } finally {
          conn.release();
        }
      } else {
        res.redirect(req.headers.referer);
      }
    } else {
      flash.create({
        status: false,
        message: '관리자 - 설정에서 이메일 설정을 완료해주세요',
      });
      res.redirect(req.headers.referer);
    }
  }
});

exports.findInfoCheckout = doAsync(async (req, res, next) => {
  const {
    method,
  } = req;
  const thisSite = res.locals;
  if (method === 'GET') {
    res.render('newPassword', {
      pageTitle: `새 비밀번호 등록 - ${thisSite.setting.siteName}`,
    });
  } else if (method === 'POST') {
    const {
      submit,
    } = req.body;
    const email = req.session.email;
    const emailSetting = thisSite.setting.gmailUser && thisSite.setting.gmailPassword;
    if (emailSetting) {
      if (email) {
        if (submit === 'checkout') {
          const {
            authCode,
            password,
            passwordCheck,
          } = req.body;
          if (password === passwordCheck) {
            const conn = await pool.getConnection();
            try {
              const userClass = new User(req, res, conn);
              const authCheckUser = await userClass.get({
                email,
                authCode,
              });
              if (authCheckUser) {
                const user = await userClass.update(authCheckUser.id, {
                  password,
                });
                flash.create({
                  status: true,
                  message: '로그인 성공',
                });
                req.session.user = user;
                req.session.save(() => {
                  res.redirect('/');
                });
              } else {
                flash.create({
                  status: false,
                  message: '인증번호가 맞지 않습니다',
                });
                res.redirect(req.headers.referer);
              }
            } finally {
              conn.release();
            }
          } else {
            flash.create({
              status: false,
              message: '비밀번호가 서로 일치하지 않습니다',
            });
            res.redirect(req.headers.referer);
          }
        } else if (submit === 'newAuthCode') {
          const conn = await pool.getConnection();
          try {
            const userClass = new User(req, res, conn);
            const user = await userClass.get({
              email,
            });
            const authCode = Math.random().toString().slice(3, 7);
            await userClass.update(user.id, {
              authCode,
            });
            const emailClass = new Email(req, res, conn);
            try {
              emailClass.create(email, {
                subject: `인증 코드 - ${thisSite.setting.siteName}`,
                content: `
                <h1>새 인증 코드 - ${authCode}</h1>
                `,
              });
              flash.create({
                status: true,
                message: '인증코드를 새로 발송하였습니다',
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
        }
      } else {
        flash.create({
          status: false,
          message: '이메일 정보가 없습니다',
        });
        res.redirect('/findInfo');
      }
    } else {
      flash.create({
        status: false,
        message: '관리자 - 설정에서 이메일 설정을 완료해주세요',
      });
      res.redirect(req.headers.referer);
    }
  } else {
    next();
  }
});

exports.rank = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      date,
    } = req.query;
    const userClass = new User(req, res, conn);
    const pointRanks = await userClass.getPointRanks({ date });
    res.render('rank', {
      pageTitle: `포인트 랭킹 - ${res.locals.setting.siteName}`,
      pointRanks,
      date,
    });
  } finally {
    conn.release();
  }
});

exports.freePoint = doAsync(async (req, res, next) => {
  const user = res.locals.user;
  if (user) {
    const conn = await pool.getConnection();
    try {
      const pointClass = new Point(req, res, conn);
      try {
        await pointClass.freePoint();
        flash.create({
          status: true,
          message: '무료 포인트 지급완료',
        });
      } catch (e) {
        flash.create({
          status: false,
          message: e.message,
        });
      }
    } finally {
      conn.release();
    }
  } else {
    flash.create({
      status: false,
      message: '로그인이 필요합니다',
    });
  }
  res.redirect(req.headers.referer);
});

exports.robots = doAsync(async (req, res, next) => {
  res.set('Content-Type', 'text/plain').render('robots');
});

exports.feed = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const query = `SELECT a.*, a.nickName AS nonMember, b.title AS boardTitle, b.slug AS boardSlug, c.title AS category, u.nickName AS nickName
    FROM article AS a
    LEFT JOIN board AS b
    ON a.article_board_ID = b.id
    LEFT JOIN category AS c
    ON a.article_category_ID = c.id
    LEFT JOIN user AS u
    ON a.article_user_ID = u.id
    LEFT JOIN permission AS p
    ON u.permission = p.permission
    WHERE a.status = 2
    ORDER BY a.createdAt DESC`;
    const [articles, ] = await conn.query(query);
    const articleClass = new Article(req, res, conn);
    articles.forEach(article => {
      if (!article.nickName) article.nickName = article.nonMember;
      article = articleClass.setInfo(article);
      article.datetime = moment(article.updatedAt).format('ddd, DD MMM YYYY HH:mm:ss ZZ', 'ddd, DD MMM YY HH:mm:ss ZZ');
    });
    let lastDatetime = null;
    if (articles.length) lastDatetime = moment(articles[0].updatedAt).format('ddd, DD MMM YYYY HH:mm:ss ZZ', 'ddd, DD MMM YY HH:mm:ss ZZ');
    res.set('Content-Type', 'text/xml').render('feed', {
      articles,
      lastDatetime,
    });
  } finally {
    conn.release();
  }
});

exports.sitemap = doAsync(async (req, res, next) => {
  res.set('Content-Type', 'text/xml').render('sitemap');
});

exports.sitemapCommons = doAsync(async (req, res, next) => {
  res.set('Content-Type', 'text/xml').render('sitemap/commons');
});

exports.sitemapBoard = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const query = `SELECT b.*, date_format(b.updatedAt,'%Y-%m-%dT%H:%i:%s+09:00') AS datetime
    FROM board AS b
    WHERE b.status = 1
    ORDER BY id DESC`;
    const [boards, ] = await conn.query(query);
    boards.forEach(board => {
      board.slugRaw = encodeURI(board.slug);
    });
    res.set('Content-Type', 'text/xml').render('sitemap/board', {
      boards,
    });
  } finally {
    conn.release();
  }
});

exports.sitemapArticle = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const query = `SELECT a.*, date_format(a.updatedAt,'%Y-%m-%dT%H:%i:%s+09:00') AS datetime, b.slug AS boardSlug
    FROM article AS a
    LEFT JOIN board AS b
    ON a.article_board_ID = b.id
    WHERE a.status = 2
    ORDER BY id DESC`;
    const [articles, ] = await conn.query(query);
    articles.forEach(article => {
      article.boardSlugRaw = encodeURI(article.boardSlug);
    });
    res.set('Content-Type', 'text/xml').render('sitemap/article', {
      articles,
    });
  } finally {
    conn.release();
  }
});

exports.sitemapPage = doAsync(async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const query = `SELECT p.*, date_format(p.updatedAt,'%Y-%m-%dT%H:%i:%s+09:00') AS datetime
    FROM page AS p
    WHERE p.status = 1
    ORDER BY id DESC`;
    const [pages, ] = await conn.query(query);
    pages.forEach(page => {
      page.slugRaw = encodeURI(page.slug);
    });
    res.set('Content-Type', 'text/xml').render('sitemap/page', {
      pages,
    });
  } finally {
    conn.release();
  }
});

exports.sitemapStore = doAsync(async (req, res, next) => {
  const index = res.locals.setting.index;
  if (index === 'offline') {
    const conn = await pool.getConnection();
    try {
      const query = `SELECT s.*, date_format(s.updatedAt,'%Y-%m-%dT%H:%i:%s+09:00') AS datetime
      FROM offlineStore AS s
      WHERE s.status = 1
      ORDER BY s.id DESC`;
      const [stores, ] = await conn.query(query);
      res.set('Content-Type', 'text/xml').render('sitemap/store', {
        stores,
      });
    } finally {
      conn.release();
    }
  } else {
    next();
  }
});

exports.adsenseAds = doAsync(async (req, res, next) => {
  const adsenseAds = res.locals.setting.adsenseAds;
  res.send(adsenseAds);
});