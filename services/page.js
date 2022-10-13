const pagination = require('../middleware/pagination');
const datetime = require('../middleware/datetime');
const hashCreate = require('../middleware/hash');
const Class = require('./class');
const cache = require('./cache');

class Page extends Class {
  async getPagesByPagination () {
    const pnQuery = `SELECT count(*) AS count
    FROM page`;
    const [pnResult, ] = await this.conn.query(pnQuery);
    const pn = pagination(pnResult, this.req.query, 'page', 10, 5);
    const query = `SELECT *
    FROM page
    ORDER BY id DESC
    ${pn.queryLimit}`;
    const [pages, ] = await this.conn.query(query);
    return {
      pages,
      pn,
    };
  }
  async getPages (options) {
    options = Object.assign({
      status: false,
    }, options);
    const {
      status,
    } = options;
    let queryString = '';
    if (status) {
      queryString += 'WHERE status = 1\n';
    }
    const query = `SELECT *
    FROM page
    ${queryString}
    `;
    const [pages, ] = await this.conn.query(query);
    return pages;
  }
  async get (pageId) {
    const query = `SELECT *
    FROM page
    WHERE id = ?`;
    const [pages, ] = await this.conn.query(query, [
      pageId,
    ]);
    if (pages.length) {
      return pages[0];
    } else {
      return null;
    }
  }
  async set () {
    cache.pages = await this.getPages();
  }
  async create (data) {
    data = Object.assign({
      title: null,
      slug: null,
      html: null,
      css: null,
      javascript: null,
    }, data);
    console.log(data);
    const {
      title,
      slug,
      html,
      css,
      javascript,
    } = data;
    const query = `INSERT INTO page
    (title, slug, html, css, javascript)
    VALUES (?, ?, ?, ?, ?)`;
    await this.conn.query(query, [
      title,
      slug || hashCreate(6),
      html,
      css,
      javascript,
    ]);
    await this.set();
  }
  async update (pageId, data) {
    const page = await this.get(pageId);
    data = Object.assign({
      title: page.title,
      slug: page.slug,
      html: page.html,
      css: page.css,
      javascript: page.javascript,
      status: page.status,
    }, data);
    const {
      title,
      slug,
      html,
      css,
      javascript,
      status,
    } = data;
    const query = `UPDATE page
    SET
    title = ?,
    slug = ?,
    html = ?,
    css = ?,
    javascript = ?,
    status = ?
    WHERE id = ?`;
    await this.conn.query(query, [
      title,
      slug,
      html,
      css,
      javascript,
      status,
      pageId,
    ]);
    await this.set();
  }
  async remove (pageId) {
    const query = `DELETE FROM page
    WHERE id = ?`;
    await this.conn.query(query, [
      pageId,
    ]);
    await this.set();
  }
}

module.exports = Page;