const Class = require('./class');
const pagination = require('../middleware/pagination');
const datetime = require('../middleware/datetime');
const getIp = require('../middleware/getIp');
const pool = require('../middleware/database');

class Log extends Class {
  async getLogsByPagination () {
    const pnQuery = `SELECT count(*) AS count FROM log`;
    const [pnResult, ] = await this.conn.query(pnQuery);
    const pn = pagination(pnResult, this.req.query, 'page', 10);
    const query = `SELECT l.*, a.title AS title, b.slug AS boardSlug
    FROM log AS l
    LEFT JOIN article AS a
    ON l.log_article_ID = a.id
    LEFT JOIN board AS b
    ON a.article_board_ID = b.id
    ORDER BY l.createdAt DESC
    ${pn.queryLimit}`;
    const [logs, ] = await this.conn.query(query);
    logs.forEach(log => {
      log.datetime = datetime(log.createdAt);
      switch (log.type) {
        case 'index':
          log.typeKorean = '첫페이지';
          break;
        case 'board':
          log.typeKorean = '게시판';
          break;
        case 'article':
          log.typeKorean = '게시글';
          break;
      }
    })
    return {
      logs,
      pn,
    };
  }
  async getLogs () {
    const query = `SELECT *
    FROM logs`;
    const [logs, ] = await this.conn.query(query);
    return logs;
  }
  async get (logId) {
    const [logs, ] = await this.conn.query(`SELECT * FROM log WHERE id = ?`, [logId]);
    if (logs.length) {
      const log = logs[0];
      return log;
    } else {
      return null;
    }
  }
  async create (data) {
    data = Object.assign({
      type: null,
      articleId: null,
    }, data);
    const {
      type,
      articleId,
    } = data;
    if (!this.res.locals.user?.isManager && !this.res.locals.user?.isAdmin) {
      const query = `INSERT INTO log
      (log_article_ID, type, ip, referer, userAgent)
      VALUES (?, ?, ?, ?, ?)`;
      const ip = getIp(this.req);
      let referer = null;
      if (this.req.headers.referer) {
        referer = decodeURI(this.req.headers.referer);
      } else {
        referer = this.req.headers.referer;
      }
      const userAgent = this.req.headers['user-agent'];
      await this.conn.query(query, [
        articleId,
        type,
        ip,
        referer,
        userAgent,
      ]);
    }
  }
  async createUnsync (data) {
    data = Object.assign({
      type: null,
      articleId: null,
    }, data);
    const {
      type,
      articleId,
    } = data;
    if (!this.res.locals.user?.isManager && !this.res.locals.user?.isAdmin) {
      const conn = await pool.getConnection();
      try {
        const ip = getIp(this.req);
        let referer = null;
        if (this.req.headers.referer) {
          referer = decodeURI(this.req.headers.referer);
        } else {
          referer = this.req.headers.referer;
        }
        const userAgent = this.req.headers['user-agent'];
        const conn = await pool.getConnection();
        try {
          const query = `INSERT INTO log
          (log_article_ID, type, ip, referer, userAgent)
          VALUES (?, ?, ?, ?, ?)`;
          await conn.query(query, [
            articleId,
            type,
            ip,
            referer,
            userAgent,
          ]);
        } finally {
          conn.release();
        }
      } finally {
        conn.release();
      }
    }
  }
  async update (logId, data) {
    
  }
  async remove (logId) {
    await this.conn.query(`DELETE FROM log WHERE id = ?`, [logId]);
  }
}

module.exports = Log;