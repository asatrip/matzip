const colors = require('colors');
const pool = require('./middleware/database');
const sql = require('./config.json').sql.production;
const updates = require('./update.json');
const hashCreate = require('./middleware/hash');

const argv = process.argv[2] || null;

const main = async () => {
  try {
    const conn = await pool.getConnection();
    try {
      if (argv === null) {
        for await (let update of updates) {
          let query = update.sql;
          if (sql.database !== 'cms') query = update.sql.replaceAll(`\`cms\``, `\`${sql.database}\``);
          try {
            await conn.query(query);
            console.log('업데이트 완료'.green + ` ${update.hash}`);
          } catch (e) {
            console.log('이미 업데이트됨'.red);
          }
        }
      }
      if (argv === 'log') {
        await conn.query(`DROP TABLE log`);
      }
      if (argv === 'section') {
        await conn.query(`set FOREIGN_KEY_CHECKS = 0;`);
        await conn.query(`DROP TABLE sectionGroup`);
        await conn.query(`DROP TABLE section`);
        await conn.query(`set FOREIGN_KEY_CHECKS = 1;`);
      }
      if (argv === 'image') {
        const [articles, ] = await conn.query(`SELECT * FROM article`);
        for await (let article of articles) {
          const [images, ] = await conn.query(`SELECT * FROM image WHERE image_article_ID = ?`, [article.id]);
          if (images.length) {
            const reimages = JSON.stringify(images.map(image => image.key));
            await conn.query(`UPDATE article SET images = ? WHERE id = ?`, [
              reimages,
              article.id,
            ]);
          }
        }
      }
      if (argv === 'permissionBoard') {
        const [permissions, ] = await conn.query(`SELECT * FROM permission`);
        const [boards, ] = await conn.query(`SELECT * FROM board`);
        for await (let permission of permissions) {
          for await (let board of boards) {
            const query = `INSERT INTO permissionBoard
            (permissionBoard_permission_ID, permissionBoard_board_ID)
            VALUES (?, ?)`;
            await conn.query(query, [
              permission.id,
              board.id,
            ]);
          }
        }
      }
      if (argv === 'articleSlug') {
        const [articles, ] = await conn.query(`SELECT * FROM article`);
        for await (let article of articles) {
          if (!article.slug) {
            const query = `UPDATE article
            SET slug = ?
            WHERE id = ?`;
            await conn.query(query, [
              hashCreate(11),
              article.id,
            ]);
          }
        }
      }
      if (argv === 'editor') {
        const [settings, ] = await conn.query(`SELECT * FROM setting ORDER BY id DESC LIMIT 1`);
        if (settings.length) {
          await conn.query(`UPDATE setting SET editor = ? WHERE id = ?`, [
            'ckeditor5',
            settings[0].id,
          ]);
        }
      }
    } finally {
      conn.release();
      console.log('Update Complete');
      process.exit(1);
    }
  } catch (e) {
    console.error(e);
  }
};

main();