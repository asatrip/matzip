const Class = require('./class');
const cache = require('./cache');

class Asset extends Class {
  async getAssets () {
    const [assets, ] = await this.conn.query(`SELECT * FROM assets ORDER BY id ASC`);
    return assets;
  }
  async get (assetId) {
    const [assets, ] = await this.conn.query(`SELECT * FROM assets WHERE id = ?`, [assetId]);
    if (assets.length) {
      return assets[0];
    } else {
      return null;
    }
  }
  async set () {
    cache.assets = await this.getAssets();
  }
  async create (data) {
    await this.get();
  }
  async update (assetId, data) {
    await this.get();
  }
  async remove (assetId) {
    await this.get();
  }
}

module.exports = Asset;