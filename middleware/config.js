const configJson = require('../config.json');

class Config {
  constructor () {
    this.storageType = configJson.storageType;
    this.storage = configJson.storage;
    this.lang = configJson.language;
    this.firebase = configJson.firebase;
    this.plugins = configJson.plugins;
    if (process.env.NODE_ENV === 'development') {
      this.sql = configJson.sql?.development;
      this.storage = configJson.storage?.development;
    } else {
      this.sql = configJson.sql.production;
      this.storage = configJson.storage?.production;
    }
  }
  getStorageHost () {
    if (this.storage === 'local') {
      return `/storage`;
    } else {
      return this.storage.host;
    }
  }
  getStorage () {
    return this.storage;
  }
  getDatabase () {
    return this.sql;
  }
  getLang () {
    return this.lang;
  }
  getFirebase () {
    return this.firebase;
  }
  getPlugins () {
    return this.plugins;
  }
}

const config = new Config();

module.exports = config;