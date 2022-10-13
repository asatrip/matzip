/*
License
와플보드 라이센스는 사이트 1개당 라이센스 입니다.
와플보드 소스의 무단 복제, 재배포는 금지되어 있습니다.
*/

(async () => {
  const fs = require('fs');
  const http = require('http');
  const path = require('path');
  const { Server } = require('socket.io');
  const express = require('express');
  const cookieParser = require('cookie-parser');
  const session = require('express-session');
  const timeout = require('connect-timeout');
  const rateLimit = require('express-rate-limit');
  const {
    sessionSecret,
    timezone,
  } = require('./config');
  const moment = require('moment');
  require('moment-timezone');
  moment.tz.setDefault(timezone);
  const morgan = require('morgan');
  const colors = require('colors');
  const i18n = require('i18n');
  const exec = require('./middleware/exec');
  const pool = require('./middleware/database');
  const doAsync = require('./middleware/doAsync');
  const datetime = require('./middleware/datetime');
  const shuffle = require('./middleware/shuffle');
  const counter = require('./services/counter');
  const config = require('./middleware/config');
  const UserGroup = require('./services/userGroup');
  const Section = require('./services/section');
  const SectionGroup = require('./services/sectionGroup');
  const Menu = require('./services/menu');
  const Alarm = require('./services/alarm');
  const Message = require('./services/message');
  const Setting = require('./services/setting');
  const Banner = require('./services/banner');
  const Board = require('./services/board');
  const Asset = require('./services/asset');
  const Permission = require('./services/permission');
  const Chat = require('./services/chat');
  const Page = require('./services/page');
  const Go = require('./services/go');
  const SessionControl = require('./services/session');
  const blockUrls = require('./config/blockUrls');
  const public = require('./services/public');
  const getIp = require('./middleware/getIp');
  const cache = require('./services/cache');
  
  const sql = config.getDatabase();
  cache.storage = config.getStorageHost();
  const lang = config.getLang();
  const plugins = config.getPlugins();
  
  const indexRouter = require('./routes/index');
  const userRouter = require('./routes/user');
  const adminRouter = require('./routes/admin');
  const apiRouter = require('./routes/api');
  const boardRouter = require('./routes/board');
  
  const app = express();
  
  const port = process.env.PORT || 3000;

  exec.systemCheck();
  
  app.io = new Server();
  const server = http.createServer(app);
  app.io.attach(server);
  
  app.io.on('connection', (socket) => {
    app.io.sockets.emit('count', app.io.engine.clientsCount);
  
    socket.on('disconnect', () => {
      // console.log('접속 해제');
      app.io.sockets.emit('count', app.io.engine.clientsCount);
    });
  
    socket.on('chat', async (data) => {
      if (data.user?.id && data.user?.permission) {
        data.time = moment(new Date()).format('hh:mm');
        app.io.sockets.emit('chat', data);
        const chatClass = new Chat(null, null, null);
        await chatClass.create(data);
      }
    });
  
    socket.on('notice', (data) => {
      app.io.sockets.emit('notice', data);
    });
  
    socket.on('adminBlock', (data) => {
      app.io.sockets.emit('adminBlock', data);
    });
  
    // Room Chat
    socket.on('leaveRoom', (room, user) => {
      socket.leave(room, () => {
        app.io.to(room).emit('leaveRoom', room);
      });
    });
  
    socket.on('joinRoom', (room, user) => {
      socket.join(room, () => {
        app.io.to(room).emit('joinRoom', room);
      });
    });
  });
  
  // Custom
  const customExist = fs.existsSync(path.join(__dirname, `custom`));
  if (!customExist) fs.mkdirSync(path.join(__dirname, `custom`), { recursive: true });
  
  // Views
  cache.views.push(path.join(__dirname, 'views'));
  cache.views.push(path.join(__dirname, 'plugins/location/views'));

  const customList = fs.readdirSync('custom');
  cache.customs = customList;
  customList.forEach(custom => {
    cache.views.push(path.join(__dirname, `custom/${custom}/views`));
    const headerFolderExist = fs.existsSync(path.join(__dirname, `custom/${custom}/views/header`));
    if (headerFolderExist) {
      const headers = fs.readdirSync(path.join(__dirname, `custom/${custom}/views/header`)).map(file => file.replace('.ejs', ''));
      cache.custom.headers.push(headers);
    }
    const footerFolderExist = fs.existsSync(path.join(__dirname, `custom/${custom}/views/footer`));
    if (footerFolderExist) {
      const footers = fs.readdirSync(path.join(__dirname, `custom/${custom}/views/footer`)).map(file => file.replace('.ejs', ''));
      cache.custom.footers.push(footers);
    }
    const indexFolderExist = fs.existsSync(path.join(__dirname, `custom/${custom}/views/index`));
    if (indexFolderExist) {
      const indexs = fs.readdirSync(path.join(__dirname, `custom/${custom}/views/index`)).map(file => file.replace('.ejs', ''));
      cache.custom.indexs.push(indexs);
    }
  });
  
  app.set('trust proxy', true);
  app.set('views', cache.views);
  app.set('view engine', 'ejs');
  
  const morganMiddleware = morgan((tokens, req, res) => {
    if (!req.headers['user-agent']?.match('ELB-HealthChecker')) {
      const status = tokens.status(req, res);
      const ip = getIp(req);
      const responseTime = tokens['response-time'](req, res) + 'ms';
      let statusWithColor = status;
      if (status?.match(/2[0-9][0-9]/)) {
        statusWithColor = status.green;
      } else if (status?.match(/3[0-9][0-9]/)) {
        statusWithColor = status.cyan;
      } else if (status?.match(/4[0-9][0-9]/)) {
        statusWithColor = status.red;
      } else if (status?.match(/5[0-9][0-9]/)) {
        statusWithColor = status.red;
      } else if (status) {
        statusWithColor = status.gray;
      } else {
        statusWithColor = status;
      }7
      const log = [];
      log.push(req.method);
      log.push(req.url);
      log.push(statusWithColor);
      log.push(responseTime);
      if (ip) log.push(ip.gray);
      log.push(`${req.originalUrl}`.gray);
      return log.join(' ');
    }
  });
  
  if (process.env.NODE_ENV === 'development') {
    // app.use(morganMiddleware);
  } else {
    app.use(morganMiddleware);
  }
  
  app.use(timeout('10s'));
  app.use(express.json({
    limit: '50mb',
  }));
  app.use(express.urlencoded({
    limit: '50mb',
    extended: false,
  }));
  app.use(cookieParser());
  // 동적 요청에 대한 응답을 보낼 때 etag 생성을 하지 않도록 설정
  //  app.set("etag", false);
  // 정적 요청에 대한 응답을 보낼 때 etag 생성을 하지 않도록 설정
  const staticOptions = {
    // etag: false,
  };
  app.use(express.static(path.join(__dirname, 'public'), staticOptions));
  app.use(express.static(path.join(__dirname, 'plugins/location/public')));
  cache.customs.forEach(custom => {
    app.use(express.static(path.join(__dirname, `custom/${custom}/public`)));
  });
  const sessionControl = new SessionControl(null, null, null);
  app.use(session({
    key: sessionSecret,
    secret: sessionSecret,
    store: sessionControl.getSessionStore(),
    // proxy: true,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 1,
    },
  }));
  
  i18n.configure({
    locales: [`${lang}`],
    cookie: 'lang',
    defaultLocale: `${lang}`,
    directory: path.join(__dirname + '/locales'),
  });
  app.use(i18n.init);

  const limiter = rateLimit({
    windowMs: 1000 * 10,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: async (req, res) => {
      console.error(`잦은 요청 : ${getIp(req)} - ${req.method} - ${req.originalUrl}`.red);
      return '너무 많은 요청을 하였습니다. 잠시 후 다시 시도해주세요';
    },
  });

  app.use(limiter);

  // SQL Status Check
  try {
    const conn = await pool.getConnection();
    console.log('DB 접속 성공'.blue);
    cache.sqlStatus = true;
    conn.release();
  } catch (err) {
    console.log('DB 접속 실패'.red);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.');
    } else {
      console.error(err);
    }

    cache.sqlStatus = false;

    try {
      await pool.end();
    } catch (err) {
      throw err;
    }
  }

  let poolResetCount = 0;
  const sqlCheck = async () => {
    if (!cache.sqlStatus) {
      try {
        const conn = await pool.getConnection();
        conn.release();
        console.log('DB 재접속 성공');
        cache.sqlStatus = true;
      } catch (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
          console.error('Database has too many connections.');
        }
        if (err.code === 'ECONNREFUSED') {
          console.error('Database connection was refused.');
        } else {
          console.error(err);
        }

        cache.sqlStatus = false;

        poolResetCount ++;

        if (poolResetCount >= 2) {
          try {
            await pool.end();
          } catch (err) {
            console.error(err);
          }
          exec.restart();
        }
      }
    }
  };
  setInterval(sqlCheck, 1000 * 5);

  app.use('*', doAsync(async (req, res, next) => {
    if (!cache.sqlStatus) {
      res.status(500).render('sql');
    } else {
      next();
    }
  }));
  
  // Setting
  const conn = await pool.getConnection();
  try {
    const menuClass = new Menu(null, null, conn);
    const boardClass = new Board(null, null, conn);
    const userGroupClass = new UserGroup(null, null, conn);
    const bannerClass = new Banner(null, null, conn);
    const permissionClass = new Permission(null, null, conn);
    const assetClass = new Asset(null, null, conn);
    const settingClass = new Setting(null, null, conn);
    const chatClass = new Chat(null, null, conn);
    const sectionGroupClass = new SectionGroup(null, null, conn);
    // const sectionClass = new Section(null, null, conn);
    const pageClass = new Page(null, null, conn);
    const goClass = new Go(null, null, conn);
    cache.plugins = plugins;

    await settingClass.set();
    await menuClass.set();
    await permissionClass.set();
    await boardClass.set();
    await userGroupClass.set();
    await bannerClass.set();
    await assetClass.set();
    await chatClass.set();
    await sectionGroupClass.set();
    await pageClass.set();
    await goClass.set();

    // cache.sideBoards = await sectionClass.get('side');

    if (plugins?.find(plugin => plugin === 'location')) {
      const Location = require('./plugins/location/services/location');
      const storeClass = new Location(null, null, conn);
      await storeClass.set();
    }
  } finally {
    conn.release();
  }
  
  // Loop
  // const loop = require('./middleware/loop');
  const getCounter = async () => {
    cache.count = await counter.getCount();
  };
  getCounter();
  setInterval(getCounter, 1000 * 60 * 5);

  // Check Articles
  cache.checkArticles();

  // BlockUrls
  app.use(blockUrls, doAsync(async (req, res, next) => {
    res.status(404).render('404');
  }));

  // ELB-HealthChecker
  app.use('*', doAsync(async (req, res, next) => {
    if (req.headers['user-agent']?.match('ELB-HealthChecker')) {
      res.send('ok');
    } else {
      next();
    }
  }));

  // Datetime
  app.use('*', doAsync(async (req, res, next) => {
    // Datetime
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const dayName = days[today.getDay()];
    const datetimeContent = `${month}월 ${day}일 (${dayName})`;
    res.locals.datetime = datetimeContent;
    next();
  }));
  
  app.use('*', doAsync(async (req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.storage = cache.storage;
    res.locals.menus = cache.menus;
    res.locals.banners = cache.banners;
    res.locals.permissions = cache.permissions;
    res.locals.setting = cache.setting;
    res.locals.favicon = cache.favicon;
    res.locals.boards = cache.boards;
    res.locals.pages = cache.pages;
    res.locals.userGroups = cache.userGroups;
    res.locals.sectionGroups = cache.sectionGroups;
    res.locals.assets = cache.assets;
    res.locals.count = cache.count;
    res.locals.plugins = cache.plugins;
    res.locals.gos = cache.gos;
    res.locals.shuffle = shuffle;

    res.locals.publicUser = public.getUser(req.session.user);
    res.locals.publicBoards = public.getBoards(cache.boards);
    res.locals.publicChats = public.getChats(cache.chats);
    res.locals.publicSetting = public.getSetting(cache.setting);

    if (req.cookies['theme'] === 'dark') {
      res.locals.userTheme = 'dark';
      res.locals.userThemeReverse = 'light';
      res.locals.userThemeReverseKorean = '라이트모드 전환';
    } else {
      res.locals.userTheme = 'light';
      res.locals.userThemeReverse = 'dark';
      res.locals.userThemeReverseKorean = '다크모드 전환';
    }

    cache.setting.headerDesign = cache.setting.headerDesign?.replaceAll('\r\n', '<br>');
    cache.setting.footerDesign = cache.setting.footerDesign?.replaceAll('\r\n', '<br>');
    if (res.locals.setting) {
      next();
    } else {
      res.status(404).render('loading');
    }
  }));
  
  app.use('*', doAsync(async (req, res, next) => {
    if (!req.baseUrl.match('/api') && !req.baseUrl.match('/admin')) {
      const conn = await pool.getConnection();
      try {
        // 사이드 섹션
        const sectionClass = new Section(req, res, conn);
        const sideSectionGroups = cache.sectionGroups.filter(sectionGroup => sectionGroup.type === 'side')
        for await (let sectionGroup of sideSectionGroups) {
          for await (let section of sectionGroup.sections) {
            section.articles = await sectionClass.getSectionArticles(section.id, {
              boardId: section.section_board_ID,
              articleOrder: section.articleOrder,
              viewCount: section.viewCount,
            });
          }
        }
        cache.sideSectionGroups = sideSectionGroups;
        res.locals.sideSectionGroups = cache.sideSectionGroups;
        
        // 알람, 메시지
        const user = res.locals.user;
        if (user) {
          const conn = await pool.getConnection();
          try {
            const alarm = new Alarm(req, res, conn);
            const message = new Message(req, res, conn);
            const permissionClass = new Permission(req, res, conn);
            res.locals.alarms = await alarm.getAlarms(user);
            res.locals.messages = await message.getMessages(user);
      
            // 자동 등업 체크
            if (res.locals.setting.useAutoPermission) {
              await permissionClass.check(user);
            }
          } finally {
            conn.release();
          }
        }
      } finally {
        conn.release();
      }
    }
    next();
  }));
  
  // Flash Message
  require('./middleware/flash').init(app);
  
  const { isAdmin } = require('./middleware/permission');
  
  app.use('/', indexRouter);
  app.use('/', userRouter);
  app.use('/admin', isAdmin, adminRouter);
  app.use('/api', apiRouter);
  app.use('/', boardRouter);
  if (plugins?.find(plugin => plugin === 'location')) {
    const locationRouter = require('./plugins/location/routes/location');
    if (locationRouter) app.use('/', locationRouter);
  }
  
  // Error Handling
  // 500 Error
  app.use('*', async (err, req, res, next) => {
    const ip = getIp(req);
    console.error('Error status --------------------');
    console.error(`Hostname : https://${req.hostname}`);
    console.error(`Method : ${req.method}`);
    console.error(`originalUrl : ${req.originalUrl}`);
    console.error(`body :`);
    console.error(req.body);
    console.error(`IP : ${ip}`);
    console.error('---------------------------------');
    console.error(err);
    const isApi = req.baseUrl.match('/api');
    if (err.name === 'TypeError' || err.name === 'ReferenceError') {
      const error = 'EJS Rendering Error';
      if (isApi) {
        res.status(500).send({
          error,
        });
      } else {
        res.status(500).render('error', {
          error,
        });
      }
    } else if (err.name === 'ServiceUnavailableError') {
      cache.sqlStatus = false;
      const error = 'Database Unavailable Error';
      if (isApi) {
        res.status(500).send({
          error,
        });
      } else {
        res.status(500).render('error', {
          error,
        });
      }
    } else if (err.name === 'URIError') {
      const error = 'URI Decode Error';
      if (isApi) {
        res.status(500).send({
          error,
        });
      } else {
        res.status(500).render('error', {
          error,
        });
      }
    } else {
      if (isApi) {
        res.status(500).send({
          error: err.message,
        });
      } else {
        res.status(500).render('error', {
          error: err.message,
        });
      }
    }
  });
  
  // 404 Error
  app.use('*', (req, res, next) => {
    res.status(404).render('404');
  });
  
  // uncaughtException
  process.on('uncaughtException', (err) => {
    console.error('uncaughtException', err);
  });
  
  server.listen(port, () => console.log('Server is running... http://localhost:' + port));
  
  module.exports = app;
})();