const Class = require('./class');
const cache = require('./cache');

class Banner extends Class {
  async getBanners (data) {
    data = Object.assign({
      position: null,
      boardId: null,
    }, data);
    const {
      position,
      boardId,
    } = data;
    let queryString = '';
    const queryArray = [];
    if (position) {
      queryString += `WHERE position = ?\n`;
      queryArray.push(position);
    }
    if (boardId) {
      queryString += `WHERE position = ? AND banner_board_ID = ?\n`;
      queryArray.push('board', boardId);
    }
    const query = `SELECT *
    FROM banner
    ${queryString}
    ORDER BY viewOrder ASC`;
    const [banners, ] = await this.conn.query(query, queryArray);
    return banners;
  }
  async get (bannerId) {
    const [banners, ] = await this.conn.query(`SELECT * FROM banner WHERE id = ?`);
    if (banners.length) {
      const banner = banners[0];
      return banner;
    } else {
      return null;
    }
  }
  async getCount (position) {
    const [banners, ] = await this.conn.query(`SELECT count(*) AS count FROM banner WHERE position = ?`, [position]);
    return banners[0].count;
  }
  async set () {
    cache.banners = await this.getBanners();
  }
  async create (data) {
    await set();
  }
  async update (data) {
    await set();
  }
  async remove (bannerId) {
    await set();
  }
}

module.exports = Banner;