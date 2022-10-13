const Class = require('./class');
const Article = require('./article');
const Comment = require('./comment');
const Message = require('./message');
const datetime = require('../middleware/datetime');
const pagination = require('../middleware/pagination');

class Report extends Class {
  async getReports () {
    const pnQuery = `SELECT count(*) AS count FROM report`;
    const [pnResult, ] = await this.conn.query(pnQuery);
    const pn = pagination(pnResult, this.req.query, 'page', 10);
    const query = `SELECT r.*, u.nickName
    FROM report AS r
    LEFT JOIN user AS u
    ON r.report_user_ID = u.id
    LEFT JOIN article AS a
    ON r.report_article_ID = a.id
    LEFT JOIN comment AS c
    ON r.report_comment_ID = c.id
    LEFT JOIN message AS m
    ON r.report_message_ID = m.id
    WHERE r.status = 1
    ORDER BY r.createdAt DESC
    ${pn.queryLimit}`;
    const [reports, ] = await this.conn.query(query);
    const articleClass = new Article(this.req, this.res, this.conn);
    const commentClass = new Comment(this.req, this.res, this.conn);
    const messageClass = new Message(this.req, this.res, this.conn);
    for await (let report of reports) {
      report.datetime = datetime(report.createdAt);
      if (report.report_article_ID) {
        report.type = '게시글';
        const article = await articleClass.get({
          id: report.report_article_ID,
        });
        report.targetNickName = article.nickName;
      } else if (report.report_comment_ID) {
        report.type = '댓글';
        const comment = await commentClass.get(report.report_comment_ID);
        report.targetNickName = comment.nickName;
      } else if (report.report_message_ID) {
        report.type = '메시지';
        const message = await messageClass.get(report.report_message_ID);
        report.targetNickName = message.nickName;
      }
    }
    return {
      reports,
      pn,
    };
  }
  async getCount (data) {
    data = Object.assign({
      articleId: null,
      commentId: null,
    }, data);
    const { articleId, commentId } = data;
    if (articleId) {
      const [result, ] = await this.conn.query(`SELECT count(*) AS count FROM report WHERE report_article_ID = ?`, [articleId]);
      const count = result[0].count;
      return count;
    } else if (commentId) {
      const [result, ] = await this.conn.query(`SELECT count(*) AS count FROM report WHERE report_comment_ID = ?`, [commentId]);
      const count = result[0].count;
      return count;
    }
  }
  async get (reportId) {
    const [reports, ] = await this.conn.query(`SELECT * FROM report WHERE id = ?`, [reportId]);
    if (reports.length) {
      const report = reports[0];
      return report;
    } else {
      return null;
    }
  }
  async check (data) {
    data = Object.assign({
      reportType: null,
      reportId: null,
      content: null,
    }, data);
    const { reportType, reportId, content } = data;
    if (reportType && reportId && content) {
      if (this.user) {
        let result = [];
        if (reportType === 'article') {
          [result, ] = await this.conn.query(`SELECT * FROM report WHERE report_user_ID = ? AND report_article_ID = ?`, [this.user.id, reportId]);
        } else if (reportType === 'comment') {
          [result, ] = await this.conn.query(`SELECT * FROM report WHERE report_user_ID = ? AND report_comment_ID = ?`, [this.user.id, reportId]);
        } else if (reportType === 'message') {
          [result, ] = await this.conn.query(`SELECT * FROM report WHERE report_user_ID = ? AND report_message_ID = ?`, [this.user.id, reportId]);
        }
        if (!result.length) {
          return true;
        } else {
          return false;
        }
      } else {
        return {
          status: false,
          message: '로그인이 필요합니다',
        };
      }
    } else {
      return {
        status: false,
        message: '입력값이 부족합니다',
      };
    }
  }
  async create (data) {
    data = Object.assign({
      reportType: null,
      reportId: null,
      content: null,
    }, data);
    const { reportType, reportId, content } = data;
    if (reportType && reportId && content) {
      if (this.user) {
        if (await this.check(data)) {
          if (reportType === 'article') {
            await this.conn.query(`INSERT INTO report (report_user_ID, report_article_ID, content) VALUES (?, ?, ?)`, [this.user.id, reportId, content]);
            const articleClass = new Article(this.req, this.res, this.conn);
            const count = await this.getCount({ articleId: reportId });
            await articleClass.update(reportId, { reportCount: count + 1, force: true });
          } else if (reportType === 'comment') {
            await this.conn.query(`INSERT INTO report (report_user_ID, report_comment_ID, content) VALUES (?, ?, ?)`, [this.user.id, reportId, content]);
            const commentClass = new Comment(this.req, this.res, this.conn);
            const count = await this.getCount({ commentId: reportId });
            await commentClass.update(reportId, { reportCount: count + 1, force: true });
          } else if (reportType === 'message') {
            await this.conn.query(`INSERT INTO report (report_user_ID, report_message_ID, content) VALUES (?, ?, ?)`, [this.user.id, reportId, content]);
          }
          return {
            status: true,
            message: '신고 완료 하였습니다',
          };
        } else {
          return {
            status: false,
            message: '이미 신고완료한 내용입니다',
          };
        }
      } else {
        return {
          status: false,
          message: '로그인이 필요합니다',
        };
      }
    } else {
      return {
        status: false,
        message: '입력값이 부족합니다',
      };
    }
  }
  async update (reportId, data) {
    const report = await this.get(reportId);
    data = Object.assign({
      status: report.status,
    }, data);
    const { status } = data;
    await this.conn.query(`UPDATE report SET status = ? WHERE id = ?`, [status, reportId]);
  }
  async remove (reportId) {
    await this.conn.query(`DELETE FROM report WHERE id = ?`, [reportId]);
  }
}

module.exports = Report;