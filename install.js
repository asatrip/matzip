const colors = require('colors');
const mysql = require('mysql2/promise');
const sql = require('./config.json').sql.production;
const hashCreate = require('./middleware/hash');

const createPool = mysql.createPool({
  host: sql.host,
  user: sql.user,
  password: sql.password,
  port: sql.port,
});

const DATABASE_NAME = sql.database || 'cms';

const main = async () => {
  try {
    await start();
    await alarm();
    await article();
    await articleTag();
    await assets();
    await authentication();
    await banner();
    await board();
    await category();
    await chat();
    await check();
    await checkContinue();
    await comment();
    await go();
    await section();
    await sectionGroup();
    await log();
    await menu();
    await message();
    await page();
    await permission();
    await permissionBoard();
    await point();
    await pointDeposit();
    await pointWithdraw();
    await report();
    await setting();
    await tag();
    await user();
    await userArticleLike();
    await userArticleUnlike();
    await userBlockUser();
    await userBoard();
    await userChat();
    await userCommentLike();
    await userCommentUnlike();
    await userGroup();
    await userGroupBoard();
    await userUser();
    await userUserGroup();
    await addColumn();
    await end();
  } catch (e) {
    console.error(e);
  }
};

const start = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const [result, ] = await conn.query(`SHOW DATABASES LIKE '${DATABASE_NAME}'`);
      if (!result.length) {
        await conn.query(`CREATE DATABASE ${DATABASE_NAME};`);
      }
      await conn.query(`USE ${DATABASE_NAME};`);
      await conn.query(`set FOREIGN_KEY_CHECKS = 0;`);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
  }
};

const alarm = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE alarm (
        id int unsigned NOT NULL AUTO_INCREMENT,
        alarm_user_ID int unsigned DEFAULT NULL,
        alarm_relatedUser_ID int unsigned DEFAULT NULL,
        alarm_board_ID int unsigned DEFAULT NULL,
        alarm_article_ID int unsigned DEFAULT NULL,
        alarm_comment_ID int unsigned DEFAULT NULL,
        alarm_message_ID int unsigned DEFAULT NULL,
        type varchar(45) NOT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY alarm_user_ID (alarm_user_ID),
        KEY alarm_board_ID (alarm_board_ID),
        KEY alarm_article_ID (alarm_article_ID),
        KEY alarm_comment_ID (alarm_comment_ID),
        KEY alarm_message_ID (alarm_message_ID),
        KEY type (type),
        KEY alarm_relatedUser_ID (alarm_relatedUser_ID),
        KEY status (status),
        CONSTRAINT alarm_article_ID FOREIGN KEY (alarm_article_ID) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT alarm_board_ID FOREIGN KEY (alarm_board_ID) REFERENCES board (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT alarm_comment_ID FOREIGN KEY (alarm_comment_ID) REFERENCES comment (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT alarm_message_ID FOREIGN KEY (alarm_message_ID) REFERENCES message (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT alarm_relatedUser_ID FOREIGN KEY (alarm_relatedUser_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT alarm_user_ID FOREIGN KEY (alarm_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'alarm' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'alarm' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const article = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE article (
        id int unsigned NOT NULL AUTO_INCREMENT,
        article_board_ID int unsigned DEFAULT NULL,
        article_category_ID int unsigned DEFAULT NULL,
        article_user_ID int unsigned DEFAULT NULL,
        type tinyint DEFAULT '1',
        title varchar(200) NOT NULL,
        slug varchar(200) NOT NULL,
        content longtext NOT NULL,
        images longtext NULL,
        html longtext,
        notice tinyint DEFAULT '0',
        anonymous tinyint DEFAULT '0',
        likeCount int unsigned DEFAULT '0',
        unlikeCount int unsigned DEFAULT '0',
        viewCount int unsigned DEFAULT '0',
        commentCount int unsigned DEFAULT '0',
        reportCount int unsigned DEFAULT '0',
        links varchar(400) DEFAULT NULL,
        files varchar(400) DEFAULT NULL,
        nickName varchar(45) DEFAULT NULL,
        password varchar(200) DEFAULT NULL,
        status tinyint NOT NULL DEFAULT '1',
        customField01 varchar(400) DEFAULT NULL,
        customField02 varchar(400) DEFAULT NULL,
        customField03 varchar(400) DEFAULT NULL,
        customField04 varchar(400) DEFAULT NULL,
        customField05 varchar(400) DEFAULT NULL,
        customField06 varchar(400) DEFAULT NULL,
        customField07 varchar(400) DEFAULT NULL,
        customField08 varchar(400) DEFAULT NULL,
        customField09 varchar(400) DEFAULT NULL,
        customField10 varchar(400) DEFAULT NULL,
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY slug_UNIQUE (slug),
        KEY article_board_ID (article_board_ID),
        KEY article_category_ID (article_category_ID),
        KEY article_user_ID (article_user_ID),
        CONSTRAINT article_board_ID FOREIGN KEY (article_board_ID) REFERENCES board (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT article_category_ID FOREIGN KEY (article_category_ID) REFERENCES category (id) ON DELETE SET NULL ON UPDATE SET NULL,
        CONSTRAINT article_user_ID FOREIGN KEY (article_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'article' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'article' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const articleTag = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE articleTag (
        id int unsigned NOT NULL AUTO_INCREMENT,
        articleTag_article_ID int unsigned DEFAULT NULL,
        articleTag_tag_ID int unsigned DEFAULT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY articleTag_article_ID (articleTag_article_ID),
        KEY articleTag_tag_ID (articleTag_tag_ID),
        KEY status (status),
        CONSTRAINT articleTag_article_ID FOREIGN KEY (articleTag_article_ID) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT articleTag_tag_ID FOREIGN KEY (articleTag_tag_ID) REFERENCES tag (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'articleTag' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'articleTag' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const assets = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE assets (
        id int unsigned NOT NULL AUTO_INCREMENT,
        type varchar(45) DEFAULT NULL,
        slug varchar(45) DEFAULT NULL,
        image varchar(200) DEFAULT NULL,
        title varchar(200) DEFAULT NULL,
        content longtext,
        status tinyint unsigned DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY type (type),
        KEY status (status)
      ) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'assets' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'assets' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const authentication = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE authentication (
        id int unsigned NOT NULL AUTO_INCREMENT,
        authentication_user_ID int unsigned DEFAULT NULL,
        type varchar(200) NOT NULL,
        hash varchar(200) NOT NULL,
        status tinyint unsigned DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY authentication_user_ID (authentication_user_ID),
        KEY status (status),
        CONSTRAINT authentication_user_ID FOREIGN KEY (authentication_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'authentication' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'authentication' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const banner = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE banner (
        id int unsigned NOT NULL AUTO_INCREMENT,
        banner_board_ID int unsigned DEFAULT NULL,
        position varchar(200) NOT NULL,
        image varchar(200) NOT NULL,
        link varchar(200) NOT NULL,
        viewOrder int unsigned DEFAULT '100',
        newPage tinyint DEFAULT '0',
        desktopHide tinyint DEFAULT '0',
        mobileHide tinyint DEFAULT '0',
        status tinyint unsigned DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY banner_board_ID (banner_board_ID),
        CONSTRAINT banner_board_ID FOREIGN KEY (banner_board_ID) REFERENCES board (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'banner' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'banner' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const board = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE board (
        id int unsigned NOT NULL AUTO_INCREMENT,
        title varchar(200) NOT NULL,
        slug varchar(200) NOT NULL,
        type varchar(45) DEFAULT NULL,
        content MEDIUMTEXT DEFAULT NULL,
        image varchar(200) DEFAULT NULL,
        listCount int NOT NULL DEFAULT '12',
        viewOrder int unsigned DEFAULT '100',
        listPermission int DEFAULT '0',
        readPermission int DEFAULT '0',
        writePermission int DEFAULT '1',
        commentPermission int DEFAULT '1',
        writePoint int NOT NULL DEFAULT '0',
        commentPoint int NOT NULL DEFAULT '0',
        readPoint int NOT NULL DEFAULT '0',
        headerHtml varchar(800) DEFAULT NULL,
        footerHtml varchar(800) DEFAULT NULL,
        useSecret tinyint DEFAULT '0',
        useAnonymous tinyint DEFAULT '0',
        useLinks tinyint DEFAULT '0',
        useFiles tinyint DEFAULT '0',
        useHtml tinyint DEFAULT '0',
        usePermissionLimit tinyint DEFAULT '0',
        useUserGroupPermission tinyint DEFAULT '0',
        useUserAlarm tinyint DEFAULT '0',
        useAdminAlarm tinyint DEFAULT '0',
        useCustomField01 tinyint DEFAULT '0',
        useCustomField02 tinyint DEFAULT '0',
        useCustomField03 tinyint DEFAULT '0',
        useCustomField04 tinyint DEFAULT '0',
        useCustomField05 tinyint DEFAULT '0',
        useCustomField06 tinyint DEFAULT '0',
        useCustomField07 tinyint DEFAULT '0',
        useCustomField08 tinyint DEFAULT '0',
        useCustomField09 tinyint DEFAULT '0',
        useCustomField10 tinyint DEFAULT '0',
        customFieldTitle01 varchar(45) DEFAULT NULL,
        customFieldTitle02 varchar(45) DEFAULT NULL,
        customFieldTitle03 varchar(45) DEFAULT NULL,
        customFieldTitle04 varchar(45) DEFAULT NULL,
        customFieldTitle05 varchar(45) DEFAULT NULL,
        customFieldTitle06 varchar(45) DEFAULT NULL,
        customFieldTitle07 varchar(45) DEFAULT NULL,
        customFieldTitle08 varchar(45) DEFAULT NULL,
        customFieldTitle09 varchar(45) DEFAULT NULL,
        customFieldTitle10 varchar(45) DEFAULT NULL,
        status tinyint NOT NULL DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY title (title),
        UNIQUE KEY slug (slug),
        KEY status (status)
      ) ENGINE=InnoDB AUTO_INCREMENT=232 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'board' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'board' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const category = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE category (
        id int unsigned NOT NULL AUTO_INCREMENT,
        category_board_ID int unsigned DEFAULT NULL,
        title varchar(200) NOT NULL,
        viewOrder int DEFAULT '100',
        status tinyint NOT NULL DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY category_board_ID (category_board_ID),
        KEY title (title),
        KEY status (status),
        CONSTRAINT category_board_ID FOREIGN KEY (category_board_ID) REFERENCES board (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'category' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'category' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const chat = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE chat (
        id int unsigned NOT NULL AUTO_INCREMENT,
        chat_user_ID int unsigned NOT NULL,
        message varchar(200) NOT NULL,
        status tinyint NOT NULL DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY chat_user_ID (chat_user_ID),
        KEY status (status),
        CONSTRAINT chat_user_ID FOREIGN KEY (chat_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=372 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'chat' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'chat' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const check = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE \`check\` (
        id int unsigned NOT NULL AUTO_INCREMENT,
        check_user_ID int unsigned DEFAULT NULL,
        comment varchar(200) NOT NULL,
        point int unsigned DEFAULT '0',
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY check_user_ID (check_user_ID),
        KEY status (status),
        CONSTRAINT check_user_ID FOREIGN KEY (check_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=442 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'check' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'check' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const checkContinue = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE checkContinue (
        id int unsigned NOT NULL AUTO_INCREMENT,
        date int unsigned DEFAULT '0',
        point int unsigned DEFAULT '0',
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY status (status)
      ) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'checkContinue' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'checkContinue' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const comment = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE comment (
        id int unsigned NOT NULL AUTO_INCREMENT,
        comment_user_ID int unsigned DEFAULT NULL,
        comment_article_ID int unsigned DEFAULT NULL,
        comment_parent_ID int unsigned DEFAULT NULL,
        comment_group_ID int unsigned DEFAULT NULL,
        content longtext,
        likeCount int unsigned DEFAULT '0',
        unlikeCount int unsigned DEFAULT '0',
        replyCount int unsigned DEFAULT '0',
        reportCount int unsigned DEFAULT '0',
        nickName varchar(45) DEFAULT NULL,
        password varchar(200) DEFAULT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY status (status),
        KEY comment_user_ID (comment_user_ID),
        KEY comment_article_ID (comment_article_ID),
        KEY comment_parent_ID (comment_parent_ID),
        KEY comment_group_ID (comment_group_ID),
        CONSTRAINT comment_article_ID FOREIGN KEY (comment_article_ID) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT comment_group_ID FOREIGN KEY (comment_group_ID) REFERENCES comment (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT comment_parent_ID FOREIGN KEY (comment_parent_ID) REFERENCES comment (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT comment_user_ID FOREIGN KEY (comment_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'comment' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'comment' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const go = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE go (
        id int unsigned NOT NULL AUTO_INCREMENT,
        slug varchar(45) NOT NULL,
        url varchar(800) NOT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY slug (slug),
        KEY status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'go' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'go' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const section = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE section (
        id int unsigned NOT NULL AUTO_INCREMENT,
        section_sectionGroup_ID int unsigned NOT NULL,
        section_board_ID int unsigned NULL,
        type varchar(45) NOT NULL DEFAULT 'text',
        articleOrder varchar(45) NOT NULL DEFAULT 'lately',
        exceptBoards varchar(200) DEFAULT NULL,
        viewCount int unsigned DEFAULT '5',
        viewOrder int unsigned DEFAULT '100',
        status tinyint(1) NOT NULL DEFAULT '1',
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY status (status),
        KEY section_sectionGroup_ID (section_sectionGroup_ID),
        KEY section_board_ID (section_board_ID),
        CONSTRAINT section_board_ID FOREIGN KEY (section_board_ID) REFERENCES board (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT section_sectionGroup_ID FOREIGN KEY (section_sectionGroup_ID) REFERENCES sectionGroup (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'section' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'section' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const sectionGroup = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE sectionGroup (
        id int unsigned NOT NULL AUTO_INCREMENT,
        type varchar(200) NOT NULL,
        viewOrder int DEFAULT '100',
        title varchar(200) NULL,
        content varchar(200) DEFAULT NULL,
        showTitleAndContent tinyint DEFAULT '0',
        status tinyint NOT NULL DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY status (status)
      ) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'sectionGroup' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'sectionGroup' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const log = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE log (
        id int unsigned NOT NULL AUTO_INCREMENT,
        log_article_ID int unsigned,
        type varchar(45),
        ip varchar(200),
        referer varchar(200),
        userAgent varchar(200),
        status tinyint(1) NOT NULL DEFAULT '1',
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY type (type),
        KEY status (status),
        KEY log_article_ID (log_article_ID),
        CONSTRAINT log_article_ID FOREIGN KEY (log_article_ID) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'log' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'log' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const menu = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE menu (
        id int unsigned NOT NULL AUTO_INCREMENT,
        menu_parent_ID int unsigned DEFAULT NULL,
        type varchar(45) DEFAULT NULL,
        title varchar(200) NOT NULL,
        slug varchar(45) DEFAULT NULL,
        target varchar(200) NOT NULL,
        viewOrder int unsigned DEFAULT '100',
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY menu_parent_ID (menu_parent_ID),
        KEY status (status),
        CONSTRAINT menu_parent_ID FOREIGN KEY (menu_parent_ID) REFERENCES menu (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=199 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'menu' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'menu' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const message = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE message (
        id int unsigned NOT NULL AUTO_INCREMENT,
        message_sender_ID int unsigned DEFAULT NULL,
        message_recipient_ID int unsigned DEFAULT NULL,
        content longtext,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY message_recipient_ID (message_recipient_ID),
        KEY message_sender_ID (message_sender_ID),
        KEY status (status),
        CONSTRAINT message_recipient_ID FOREIGN KEY (message_recipient_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT message_sender_ID FOREIGN KEY (message_sender_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=347 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'message' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'message' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const page = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE page (
        id int unsigned NOT NULL AUTO_INCREMENT,
        title varchar(200) NOT NULL,
        slug varchar(200) NOT NULL,
        html longtext,
        css longtext,
        javascript longtext,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY slug (slug),
        KEY status (status)
      ) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'page' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'page' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const permission = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE permission (
        id int unsigned NOT NULL AUTO_INCREMENT,
        permission int unsigned DEFAULT NULL,
        title varchar(200) DEFAULT NULL,
        pointBaseline int DEFAULT '0',
        isManager tinyint DEFAULT '0',
        isAdmin tinyint DEFAULT '0',
        image varchar(200) DEFAULT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY permission_UNIQUE (permission),
        KEY status (status)
      ) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'permission' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'permission' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const permissionBoard = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE permissionBoard (
        id int unsigned NOT NULL AUTO_INCREMENT,
        permissionBoard_permission_ID int unsigned NOT NULL,
        permissionBoard_board_ID int unsigned NOT NULL,
        articleLimitType varchar(45) NOT NULL DEFAULT 'none',
        articleLimitCount int unsigned NOT NULL DEFAULT '0',
        status tinyint(1) NOT NULL DEFAULT '1',
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY status (status),
        KEY permissionBoard_permission_ID (permissionBoard_permission_ID),
        KEY permissionBoard_board_ID (permissionBoard_board_ID),
        CONSTRAINT permissionBoard_board_ID FOREIGN KEY (permissionBoard_board_ID) REFERENCES board (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT permissionBoard_permission_ID FOREIGN KEY (permissionBoard_permission_ID) REFERENCES permission (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'permissionBoard' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'permissionBoard' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const point = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE point (
        id int unsigned NOT NULL AUTO_INCREMENT,
        point_user_ID int unsigned DEFAULT NULL,
        point_board_ID int unsigned DEFAULT NULL,
        point_article_ID int unsigned DEFAULT NULL,
        point_comment_ID int unsigned DEFAULT NULL,
        point_pointDeposit_ID int unsigned DEFAULT NULL,
        type varchar(200) NOT NULL,
        point int DEFAULT NULL,
        comment varchar(200) DEFAULT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY type (type),
        KEY point_article_ID (point_article_ID),
        KEY point_board_ID (point_board_ID),
        KEY point_comment_ID (point_comment_ID),
        KEY point_user_ID (point_user_ID),
        KEY point_pointDeposit_ID (point_pointDeposit_ID),
        KEY status (status),
        CONSTRAINT point_article_ID FOREIGN KEY (point_article_ID) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT point_board_ID FOREIGN KEY (point_board_ID) REFERENCES board (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT point_comment_ID FOREIGN KEY (point_comment_ID) REFERENCES comment (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT point_pointDeposit_ID FOREIGN KEY (point_pointDeposit_ID) REFERENCES pointDeposit (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT point_user_ID FOREIGN KEY (point_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=908 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'point' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'point' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const pointDeposit = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE pointDeposit (
        id int unsigned NOT NULL AUTO_INCREMENT,
        pointDeposit_user_ID int unsigned DEFAULT NULL,
        point int unsigned DEFAULT NULL,
        bonusPoint int DEFAULT NULL,
        type varchar(45) DEFAULT NULL,
        depositor varchar(45) DEFAULT NULL,
        receipt tinyint DEFAULT NULL,
        receiptType tinyint DEFAULT NULL,
        reciptNumber varchar(45) DEFAULT NULL,
        taxbillNumber varchar(45) DEFAULT NULL,
        taxbillCompany varchar(45) DEFAULT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY pointDeposit_user_ID (pointDeposit_user_ID),
        KEY status (status),
        CONSTRAINT pointDeposit_user_ID FOREIGN KEY (pointDeposit_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'pointDeposit' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'pointDeposit' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const pointWithdraw = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE pointWithdraw (
        id int unsigned NOT NULL AUTO_INCREMENT,
        pointWithdraw_user_ID int unsigned DEFAULT NULL,
        type varchar(45) NOT NULL,
        point int unsigned NOT NULL,
        comment varchar(800) DEFAULT NULL,
        status int unsigned NOT NULL DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY pointWithdraw_user_ID (pointWithdraw_user_ID),
        CONSTRAINT pointWithdraw_user_ID FOREIGN KEY (pointWithdraw_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'pointWithdraw' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'pointWithdraw' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const report = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE report (
        id int unsigned NOT NULL AUTO_INCREMENT,
        report_user_ID int unsigned DEFAULT NULL,
        report_article_ID int unsigned DEFAULT NULL,
        report_comment_ID int unsigned DEFAULT NULL,
        report_message_ID int unsigned DEFAULT NULL,
        content longtext,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY report_user_ID (report_user_ID),
        KEY report_article_ID (report_article_ID),
        KEY report_comment_ID (report_comment_ID),
        KEY report_message_ID (report_message_ID),
        KEY status (status),
        CONSTRAINT report_article_ID FOREIGN KEY (report_article_ID) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT report_comment_ID FOREIGN KEY (report_comment_ID) REFERENCES comment (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT report_message_ID FOREIGN KEY (report_message_ID) REFERENCES message (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT report_user_ID FOREIGN KEY (report_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'pointWithdraw' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'pointWithdraw' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const setting = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE setting (
        id int unsigned NOT NULL AUTO_INCREMENT,
        hash varchar(45) DEFAULT NULL,
        \`index\` varchar(45) DEFAULT 'basic',
        editor varchar(45) DEFAULT 'ckeditor5',
        siteName varchar(200) NOT NULL DEFAULT '사이트명',
        siteNameRaw varchar(200) DEFAULT '사이트명',
        siteDescription varchar(200) NOT NULL DEFAULT '사이트 설명',
        siteKeywords varchar(200) DEFAULT NULL,
        siteDomain varchar(200) NOT NULL DEFAULT 'https://사이트주소.com',
        headerDesign longtext,
        footerDesign longtext,
        pageCommonCss longtext,
        emailService varchar(45) NOT NULL DEFAULT 'gmailWithPassword',
        gmailUser varchar(200) DEFAULT NULL,
        gmailPassword varchar(200) DEFAULT NULL,
        logoType varchar(45) NOT NULL DEFAULT 'text',
        logoImage varchar(45) DEFAULT NULL,
        logoImageDarkMode varchar(45) DEFAULT NULL,
        logoImageDesktopSize int DEFAULT '300',
        logoImageMobileSize int DEFAULT '200',
        faviconImage varchar(45) DEFAULT NULL,
        ogImage varchar(45) DEFAULT NULL,
        useCustomLayout tinyint DEFAULT '0',
        font varchar(45) DEFAULT 'basic',
        theme varchar(45) DEFAULT 'white',
        boardTheme varchar(45) DEFAULT 'basic',
        headerTemplate varchar(45) NOT NULL DEFAULT 'basic',
        footerTemplate varchar(45) NOT NULL DEFAULT 'basic',
        mainTemplate varchar(45) DEFAULT 'basic',
        indexTemplate varchar(45) NOT NULL DEFAULT 'basic',
        headerFontColor varchar(45) NOT NULL DEFAULT '#000',
        headerBackgroundColor varchar(45) NOT NULL DEFAULT '#fff',
        bodyFontColor varchar(45) NOT NULL DEFAULT '#000',
        bodyBackgroundColor varchar(45) DEFAULT '#EBEDF3',
        pointColor varchar(45) NOT NULL DEFAULT '#00FFA8',
        pointBackgroundColor varchar(45) NOT NULL DEFAULT '#888',
        indexH1 varchar(200) DEFAULT NULL,
        indexH2 varchar(200) DEFAULT NULL,
        copyright longtext,
        language varchar(45) NOT NULL DEFAULT 'ko',
        license tinyint DEFAULT '0',
        joinMethod varchar(45) NOT NULL DEFAULT 'simple',
        smsCallerId varchar(45) DEFAULT NULL,
        smsServiceId varchar(45) DEFAULT NULL,
        smsServiceSecretKey varchar(45) DEFAULT NULL,
        customHeadTags longtext,
        customHeaderTags longtext,
        customFooterTags longtext,
        adsenseAds varchar(400) DEFAULT NULL,
        adsenseIndexTop text,
        adsenseIndexBottom text,
        adsenseArticleTop text,
        adsenseArticleBottom text,
        adsenseArticleCenter text,
        adsenseSide text,
        adsenseCustom text,
        useAutoPermission tinyint DEFAULT '0',
        autoPermissionType tinyint DEFAULT '1',
        useManagerArticle tinyint DEFAULT '0',
        useManagerChat tinyint DEFAULT '0',
        useWithdraw tinyint DEFAULT '0',
        withdrawType tinyint DEFAULT '2',
        useEmailAuthentication tinyint DEFAULT '0',
        useSmsAuthentication tinyint DEFAULT '0',
        useTermsAndPrivacy tinyint DEFAULT '0',
        useArticleViewCount tinyint DEFAULT '0',
        useVisitCount tinyint DEFAULT '0',
        useWorkingUser tinyint DEFAULT '0',
        useMessage tinyint DEFAULT '1',
        useChat tinyint DEFAULT '1',
        useSms tinyint DEFAULT '0',
        usePermissionImage tinyint DEFAULT '1',
        usePointWithdraw tinyint DEFAULT '0',
        pointWithdrawLimit int DEFAULT '0',
        checkPoint int DEFAULT '0',
        joinPoint int DEFAULT '0',
        invitePoint int DEFAULT '0',
        reportCount int DEFAULT '0',
        authorLikePoint int unsigned DEFAULT '0',
        userLikePoint int unsigned DEFAULT '0',
        articlePointLimit int unsigned DEFAULT '0',
        commentPointLimit int unsigned DEFAULT '0',
        authorLikePointLimit int unsigned DEFAULT '0',
        userLikePointLimit int unsigned DEFAULT '0',
        freePointTerm varchar(45) DEFAULT 'daily',
        freePoint int unsigned DEFAULT '0',
        blockWords longtext,
        useJoinPhone tinyint DEFAULT '0',
        useJoinRealName tinyint DEFAULT '0',
        useJoinBirthDay tinyint DEFAULT '0',
        useCheckComments tinyint DEFAULT '0',
        checkComments longtext DEFAULT NULL,
        desktopBannerRowsHeader int DEFAULT '2',
        desktopBannerRowsIndexTop int DEFAULT '2',
        desktopBannerRowsIndexBottom int DEFAULT '2',
        desktopBannerRowsSideTop int DEFAULT '1',
        desktopBannerRowsSideBottom int DEFAULT '1',
        desktopBannerRowsArticleTop int DEFAULT '2',
        desktopBannerRowsArticleBottom int DEFAULT '2',
        desktopBannerRowsCustom int DEFAULT '2',
        mobileBannerRowsHeader int DEFAULT '1',
        mobileBannerRowsIndexTop int DEFAULT '1',
        mobileBannerRowsIndexBottom int DEFAULT '1',
        mobileBannerRowsSideTop int DEFAULT '1',
        mobileBannerRowsSideBottom int DEFAULT '1',
        mobileBannerRowsArticleTop int DEFAULT '1',
        mobileBannerRowsArticleBottom int DEFAULT '1',
        mobileBannerRowsCustom int DEFAULT '1',
        bannerAlignHeader varchar(45) DEFAULT 'lately',
        bannerAlignIndexTop varchar(45) DEFAULT 'lately',
        bannerAlignIndexBottom varchar(45) DEFAULT 'lately',
        bannerAlignSideTop varchar(45) DEFAULT 'lately',
        bannerAlignSideBottom varchar(45) DEFAULT 'lately',
        bannerAlignArticleTop varchar(45) DEFAULT 'lately',
        bannerAlignArticleBottom varchar(45) DEFAULT 'lately',
        bannerAlignLeftWing varchar(45) DEFAULT 'lately',
        bannerAlignRightWing varchar(45) DEFAULT 'lately',
        bannerAlignCustom varchar(45) DEFAULT 'lately',
        bannerGapDesktop varchar(45) DEFAULT '20',
        bannerGapMobile varchar(45) DEFAULT '10',
        bannerBorderRounding tinyint DEFAULT '1',
        bannerFollow tinyint DEFAULT '0',
        boardPrevNextArticle tinyint DEFAULT '1',
        boardAllArticle tinyint DEFAULT '0',
        boardAuthorArticle tinyint DEFAULT '0',
        writingTerm int DEFAULT '0',
        terms longtext,
        privacy longtext,
        useSocialApple tinyint DEFAULT '0',
        useSocialGoogle tinyint DEFAULT '0',
        useSocialFacebook tinyint DEFAULT '0',
        useSocialTwitter tinyint DEFAULT '0',
        useSocialNaver tinyint DEFAULT '0',
        useSocialKakao tinyint DEFAULT '0',
        socialAppleServiceId varchar(200) DEFAULT NULL,
        socialAppleTeamId varchar(200) DEFAULT NULL,
        socialAppleKeyId varchar(200) DEFAULT NULL,
        socialAppleAuthKey varchar(800) DEFAULT NULL,
        socialGoogleClientId varchar(200) DEFAULT NULL,
        socialGoogleClientSecret varchar(200) DEFAULT NULL,
        socialFacebookAppId varchar(200) DEFAULT NULL,
        socialFacebookAppSecret varchar(200) DEFAULT NULL,
        socialTwitterApiKey varchar(200) DEFAULT NULL,
        socialTwitterApiSecret varchar(200) DEFAULT NULL,
        socialNaverClientId varchar(200) DEFAULT NULL,
        socialNaverClientSecret varchar(200) DEFAULT NULL,
        socialKakaoClientId varchar(200) DEFAULT NULL,
        socialKakaoClientSecret varchar(200) DEFAULT NULL,
        telegramToken varchar(200) DEFAULT NULL,
        telegramChatId varchar(45) DEFAULT NULL,
        naverCloudPlatformAccessKeyId varchar(200) DEFAULT NULL,
        naverCloudPlatformSecretKey varchar(200) DEFAULT NULL,
        googleCloudPlatformApiKey varchar(200) DEFAULT NULL,
        kakaoJavascriptKey varchar(200) DEFAULT NULL,
        parsingServer VARCHAR(45) DEFAULT NULL,
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY siteName_UNIQUE (siteName)
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'setting' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'setting' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const tag = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE tag (
        id int unsigned NOT NULL AUTO_INCREMENT,
        \`key\` varchar(200) DEFAULT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY title (\`key\`),
        KEY status (status)
      ) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'tag' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'tag' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const user = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE user (
        id int unsigned NOT NULL AUTO_INCREMENT,
        user_parent_ID int unsigned DEFAULT NULL,
        email varchar(200) DEFAULT NULL,
        password varchar(200) NOT NULL,
        nickName varchar(45) NOT NULL,
        emailAuthentication tinyint DEFAULT '0',
        permission int DEFAULT '1',
        workingUser tinyint unsigned DEFAULT '0',
        point int DEFAULT '0',
        maxPoint int DEFAULT '0',
        realName varchar(45) DEFAULT NULL,
        realNameAuthentication tinyint DEFAULT '0',
        phone varchar(45) DEFAULT NULL,
        phoneAuthentication tinyint DEFAULT '0',
        image varchar(200) DEFAULT NULL,
        ios varchar(400) DEFAULT NULL,
        android varchar(400) DEFAULT NULL,
        appleId varchar(200) DEFAULT NULL,
        googleId varchar(200) DEFAULT NULL,
        facebookId varchar(200) DEFAULT NULL,
        twitterId varchar(200) DEFAULT NULL,
        naverId varchar(200) DEFAULT NULL,
        kakaoId varchar(200) DEFAULT NULL,
        marketingAgreement tinyint DEFAULT '0',
        checkContinue int DEFAULT '0',
        checkTotal int DEFAULT '0',
        lastLogin datetime DEFAULT CURRENT_TIMESTAMP,
        authCode VARCHAR(45) DEFAULT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY email (email),
        UNIQUE KEY nickName_UNIQUE (nickName),
        KEY user_parent_ID (user_parent_ID),
        KEY status (status),
        CONSTRAINT user_parent_ID FOREIGN KEY (user_parent_ID) REFERENCES user (id) ON DELETE SET NULL ON UPDATE SET NULL
      ) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'user' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'user' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const userArticleLike = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE userArticleLike (
        id int unsigned NOT NULL AUTO_INCREMENT,
        userArticleLike_user_ID int unsigned DEFAULT NULL,
        userArticleLike_article_ID int unsigned DEFAULT NULL,
        status tinyint NOT NULL DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY userArticleLike_user_ID (userArticleLike_user_ID),
        KEY userArticleLike_article_ID (userArticleLike_article_ID),
        KEY status (status),
        CONSTRAINT userArticleLike_article_ID FOREIGN KEY (userArticleLike_article_ID) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT userArticleLike_user_ID FOREIGN KEY (userArticleLike_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=247 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'userArticleLike' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'userArticleLike' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const userArticleUnlike = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE userArticleUnlike (
        id int unsigned NOT NULL AUTO_INCREMENT,
        userArticleUnlike_user_ID int unsigned DEFAULT NULL,
        userArticleUnlike_article_ID int unsigned DEFAULT NULL,
        status tinyint NOT NULL DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY userArticleUnlike_user_ID (userArticleUnlike_user_ID),
        KEY userArticleUnlike_article_ID (userArticleUnlike_article_ID),
        KEY status (status),
        CONSTRAINT userArticleUnlike_article_ID FOREIGN KEY (userArticleUnlike_article_ID) REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT userArticleUnlike_user_ID FOREIGN KEY (userArticleUnlike_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=247 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'userArticleUnlike' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'userArticleUnlike' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const userBlockUser = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE userBlockUser (
        id int unsigned NOT NULL AUTO_INCREMENT,
        userBlockUser_user_ID int unsigned NOT NULL,
        userBlockUser_targetUser_ID int unsigned NOT NULL,
        status tinyint NOT NULL DEFAULT '1',
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY userBlockUser_user_ID (userBlockUser_user_ID),
        KEY userBlockUser_targetUser_ID (userBlockUser_targetUser_ID),
        KEY status (status),
        CONSTRAINT userBlockUser_targetUser_ID FOREIGN KEY (userBlockUser_targetUser_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT userBlockUser_user_ID FOREIGN KEY (userBlockUser_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'userBlockUser' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'userBlockUser' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const userBoard = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE userBoard (
        id int unsigned NOT NULL AUTO_INCREMENT,
        userBoard_user_ID int unsigned DEFAULT NULL,
        userBoard_board_ID int unsigned DEFAULT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY userBoard_user_ID (userBoard_user_ID),
        KEY userBoard_board_ID (userBoard_board_ID),
        KEY status (status),
        CONSTRAINT userBoard_user_ID FOREIGN KEY (userBoard_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT userBoard_board_ID FOREIGN KEY (userBoard_board_ID) REFERENCES board (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'userBoard' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'userBoard' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const userChat = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE userChat (
        id int unsigned NOT NULL AUTO_INCREMENT,
        userChat_user_ID int unsigned DEFAULT NULL,
        userChat_chatRoom_ID int unsigned DEFAULT NULL,
        userChat_chat_ID int unsigned DEFAULT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY userChat_chatRoom_ID (userChat_chatRoom_ID),
        KEY userChat_chat_ID (userChat_chat_ID),
        KEY userChat_user_ID (userChat_user_ID),
        KEY status (status),
        CONSTRAINT userChat_chat_ID FOREIGN KEY (userChat_chat_ID) REFERENCES chat (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT userChat_chatRoom_ID FOREIGN KEY (userChat_chatRoom_ID) REFERENCES chatRoom (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT userChat_user_ID FOREIGN KEY (userChat_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'userChat' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'userChat' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const userCommentLike = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE userCommentLike (
        id int unsigned NOT NULL AUTO_INCREMENT,
        userCommentLike_user_ID int unsigned DEFAULT NULL,
        userCommentLike_comment_ID int unsigned DEFAULT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY userCommentLike_comment_ID (userCommentLike_comment_ID),
        KEY userCommentLike_user_ID (userCommentLike_user_ID),
        KEY status (status),
        CONSTRAINT userCommentLike_comment_ID FOREIGN KEY (userCommentLike_comment_ID) REFERENCES comment (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT userCommentLike_user_ID FOREIGN KEY (userCommentLike_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=210 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'userCommentLike' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'userCommentLike' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const userCommentUnlike = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE userCommentUnlike (
        id int unsigned NOT NULL AUTO_INCREMENT,
        userCommentUnlike_user_ID int unsigned DEFAULT NULL,
        userCommentUnlike_comment_ID int unsigned DEFAULT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY userCommentUnlike_comment_ID (userCommentUnlike_comment_ID),
        KEY userCommentUnlike_user_ID (userCommentUnlike_user_ID),
        KEY status (status),
        CONSTRAINT userCommentUnlike_comment_ID FOREIGN KEY (userCommentUnlike_comment_ID) REFERENCES comment (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT userCommentUnlike_user_ID FOREIGN KEY (userCommentUnlike_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=210 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'userCommentUnlike' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'userCommentUnlike' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const userGroup = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE userGroup (
        id int unsigned NOT NULL AUTO_INCREMENT,
        title varchar(200) NOT NULL,
        slug varchar(200) NOT NULL,
        viewOrder int unsigned DEFAULT '100',
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY title (title),
        UNIQUE KEY slug (slug),
        KEY status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'userGroup' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'userGroup' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const userGroupBoard = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE userGroupBoard (
        id int unsigned NOT NULL AUTO_INCREMENT,
        userGroupBoard_userGroup_ID int unsigned DEFAULT NULL,
        userGroupBoard_board_ID int unsigned DEFAULT NULL,
        listPermission tinyint DEFAULT '1',
        readPermission tinyint DEFAULT '1',
        writePermission tinyint DEFAULT '1',
        commentPermission tinyint DEFAULT '1',
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY userGroupBoard_userGroup_ID (userGroupBoard_userGroup_ID),
        KEY userGroupBoard_board_ID (userGroupBoard_board_ID),
        KEY status (status),
        CONSTRAINT userGroupBoard_board_ID FOREIGN KEY (userGroupBoard_board_ID) REFERENCES board (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT userGroupBoard_userGroup_ID FOREIGN KEY (userGroupBoard_userGroup_ID) REFERENCES userGroup (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'userGroupBoard' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'userGroupBoard' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const userUser = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE userUser (
        id int unsigned NOT NULL AUTO_INCREMENT,
        userUser_user_ID int unsigned DEFAULT NULL,
        userUser_targetUser_ID int unsigned DEFAULT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY userUser_user_ID (userUser_user_ID),
        KEY userUser_targetUser_ID (userUser_targetUser_ID),
        KEY status (status),
        CONSTRAINT userUser_user_ID FOREIGN KEY (userUser_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT userUser_targetUser_ID FOREIGN KEY (userUser_targetUser_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'userUser' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'userUser' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const userUserGroup = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      const query = `CREATE TABLE userUserGroup (
        id int unsigned NOT NULL AUTO_INCREMENT,
        userUserGroup_user_ID int unsigned DEFAULT NULL,
        userUserGroup_userGroup_ID int unsigned DEFAULT NULL,
        status tinyint DEFAULT '1',
        updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
        createdAt datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY userUserGroup_user_ID (userUserGroup_user_ID),
        KEY userUserGroup_userGroup_ID (userUserGroup_userGroup_ID),
        KEY status (status),
        CONSTRAINT userUserGroup_user_ID FOREIGN KEY (userUserGroup_user_ID) REFERENCES user (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT userUserGroup_userGroup_ID FOREIGN KEY (userUserGroup_userGroup_ID) REFERENCES userGroup (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      const [rows, ] = await conn.query(query);
      if (rows) {
        console.log(`'userUserGroup' 테이블 생성완료`.green);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    if (e.errno === 1050) {
      console.log(`이미 'userUserGroup' 테이블이 있습니다.`.red);
    } else {
      console.error(e);
    }
  }
};

const addColumn = async () => {
  const conn = await createPool.getConnection();
  try {
    const User = require('./services/user');
    const Menu = require('./services/menu');
    const Board = require('./services/board');
    const Permission = require('./services/permission');
    const Setting = require('./services/setting');
    const SectionGroup = require('./services/sectionGroup');
    const Section = require('./services/section');

    const settingClass = new Setting(null, null, conn);
    const setting = await settingClass.get();
    if (!setting) {
      await settingClass.create({
        hash: hashCreate(11),
        siteName: '사이트명',
        siteNameRaw: '사이트명',
      });
      console.log(`'setting' 컬럼 등록 완료`.green);
    } else {
      console.log(`이미 'setting' 컬럼이 있습니다.`.red);
    }
    const permissionClass = new Permission(null, null, conn);
    const permissions = await permissionClass.getPermissions();
    if (!permissions.length) {
      await permissionClass.create({ permission: 1, title: '1' });
      await permissionClass.create({ permission: 2, title: '2' });
      await permissionClass.create({ permission: 3, title: '3' });
      await permissionClass.create({ permission: 4, title: '4' });
      await permissionClass.create({ permission: 5, title: '5' });
      await permissionClass.create({ permission: 6, title: '6' });
      await permissionClass.create({ permission: 7, title: '7' });
      await permissionClass.create({ permission: 8, title: '8' });
      await permissionClass.create({ permission: 9, title: '9' });
      await permissionClass.create({ permission: 10, title: '관리자', isAdmin: true });
      console.log(`'permission' 컬럼 등록 완료`.green);
    } else {
      console.log(`이미 'permission' 컬럼이 있습니다.`.red);
    }
    
    const userClass = new User(null, null, conn);
    const users = await userClass.getUsers();
    if (!users.length) {
      await userClass.create({
        email: 'admin@admin.com',
        password: 'admin',
        nickName: '관리자',
        permission: 10,
      });
      await userClass.create({
        email: 'waffle@waffle.com',
        password: '$2b$10$z4x3b8KCyVai1IReenbPPe/5P2dqB73g9rhsj39HvwH03XPgYaNby',
        nickName: 'waffle',
        permission: 10,
        encrypt: false,
      });
      console.log(`'user' 컬럼 등록 완료`.green);
    } else {
      console.log(`이미 'user' 컬럼이 있습니다.`.red);
    }
    
    let board01 = null;
    let board02 = null;
    let board03 = null;
    const boardClass = new Board(null, null, conn);
    const boards = await boardClass.getBoards();
    if (!boards.length) {
      board01 = await boardClass.create({ title: '자유게시판', slug: 'free', type: 'board' });
      board02 = await boardClass.create({ title: '유머게시판', slug: 'humor', type: 'board' });
      board03 = await boardClass.create({ title: '갤러리', slug: 'gallery', type: 'gallery' });
      console.log(`'board' 컬럼 등록 완료`.green);
    } else {
      console.log(`이미 'board' 컬럼이 있습니다.`.red);
    }
    const menuClass = new Menu(null, null, conn);
    const menus = await menuClass.getMenus();
    if (!menus.length) {
      const menu01 = await menuClass.create({
        type: 'board',
        title: '커뮤니티',
        target: 'free',
      });
      await menuClass.create({
        parentId: menu01,
        type: 'board',
        title: '자유게시판',
        target: 'free',
      });
      await menuClass.create({
        parentId: menu01,
        type: 'board',
        title: '유머게시판',
        target: 'humor',
      });
      await menuClass.create({
        type: 'board',
        title: '갤러리',
        target: 'gallery',
      });
      console.log(`'menu' 컬럼 등록 완료`.green);
    } else {
      console.log(`이미 'menu' 컬럼이 있습니다.`.red);
    }
    
    let sectionGroup01 = null;
    const sectionGroupClass = new SectionGroup(null, null, conn);
    const sectionGroups = await sectionGroupClass.getSectionGroups();
    if (!sectionGroups.length) {
      sectionGroup01 = await sectionGroupClass.create({
        title: '2단그룹 1',
        type: 'rowTwo',
      });
    }
    
    const sectionClass = new Section(null, null, conn);
    const sections = await sectionClass.getSections();
    if (!sections.length) {
      await sectionClass.create({
        sectionGroupId: sectionGroup01,
        board: board01,
        type: 'text',
      });
      await sectionClass.create({
        sectionGroupId: sectionGroup01,
        board: board02,
        type: 'text',
      });
      await sectionClass.create({
        sectionGroupId: sectionGroup01,
        board: board03,
        type: 'image',
      });
    }
  } catch (e) {
    console.error(e);
  } finally {
    conn.release();
  }
};

const end = async () => {
  try {
    const conn = await createPool.getConnection();
    try {
      await conn.query(`set FOREIGN_KEY_CHECKS = 1;`);
      console.log('Install Complete');
      process.exit(1);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
  }
};

main();