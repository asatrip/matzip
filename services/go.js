const { timezone } = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault(timezone);
const datetime = require('../middleware/datetime');
const pagination = require('../middleware/pagination');
const Class = require('./class');
const cache = require('./cache');

class Go extends Class {
  async getGosByPagination () {
    const pnQuery = `SELECT count(*) AS count FROM go`;
    const [pnResult, ] = await this.conn.query(pnQuery);
    const pn = pagination(pnResult, this.req.query, 'page', 10, 5);
    const query = `SELECT *
    FROM go
    ORDER BY createdAt DESC
    ${pn.queryLimit}`;
    const [gos, ] = await this.conn.query(query);
    return {
      gos,
      pn,
    };
  }
  async getBySlug (slug) {
    const [gos, ] = await this.conn.query(`SELECT * FROM go WHERE slug = ?`, [slug]);
    if (gos.length) {
      const go = gos[0];
      return go;
    } else {
      return null;
    }
  }
  async getGos () {
    const [gos, ] = await this.conn.query(`SELECT * FROM go`);
    return gos;
  }
  async get (goId) {
    const [gos, ] = await this.conn.query(`SELECT * FROM go WHERE id = ?`, [goId]);
    if (gos.length) {
      const go = gos[0];
      return go;
    } else {
      return null;
    }
  }
  async set () {
    cache.gos = await this.getGos();
  }
  async create (data) {
    data = Object.assign({
      slug: null,
      url: null,
    }, data);
    const { slug, url } = data;
    await this.conn.query(`INSERT INTO go (slug, url) VALUES (?, ?)`, [slug, url]);
    await this.set();
  }
  async update (goId, data) {
    const go = await this.get(goId);
    data = Object.assign({
      slug: go.slug,
      url: go.url,
    }, data);
    const { slug, url } = data;
    await this.conn.query(`UPDATE go SET slug = ?, url = ? WHERE id = ?`, [slug, url, goId]);
    await this.set();
  }
  async remove (goId) {
    await this.conn.query(`DELETE FROM go WHERE id = ?`, [goId]);
    await this.set();
  }
}

module.exports = Go;