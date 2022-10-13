const axios = require('axios').default;
const Class = require('./class');
const cache = require('./cache');

class Parsing extends Class {
  async getStatus () {
    return new Promise((resolve, reject) => {
      const server = cache.setting.parsingServer;
      axios({
        url: `${server}`,
        method: 'GET',
      }).then(res => {
        if (res.status === 200 && res.data.status) {
          resolve(res.data.status);
        } else {
          resolve(false);
        }
      }). catch(err => {
        console.log(`파싱서버 연결실패: ${err.code}`);
        resolve(false);
      });
    });
  }
  async start () {
    return new Promise((resolve, reject) => {
      const server = cache.setting.parsingServer;
      axios({
        url: `${server}/api/start`,
        method: 'GET',
      }).then(res => {
        if (res.status === 200 && res.data.status) {
          console.log(res.data);
          resolve(res.data.status);
        } else {
          resolve(false);
        }
      }). catch(err => {
        console.log(`파싱서버 연결실패: ${err.code}`);
        resolve(false);
      });
    });
  }
  async stop () {
    return new Promise((resolve, reject) => {

    });
  }
  async getSetting () {
    return new Promise((resolve, reject) => {
      const server = cache.setting.parsingServer;
      axios({
        url: `${server}/api/setting`,
        method: 'GET',
      }).then(res => {
        if (res.status === 200 && res.data.status) {
          const setting = res.data?.setting;
          if (setting) {
            resolve(setting);
          } else {
            resolve({});
          }
        } else {
          resolve({});
        }
      }).catch(err => {
        console.log(`파싱서버 연결실패: ${err.code}`);
        resolve({});
      });
    });
  }
  async setSetting (data) {
    return new Promise((resolve, reject) => {
      const server = cache.setting.parsingServer;
      axios({
        url: `${server}/api/setting`,
        method: 'POST',
        data,
      }).then(res => {
        if (res.status === 200 && res.data.status) {
          console.log(res.data.status);
          resolve(true);
        } else {
          resolve(null);
        }
      }).catch(err => {
        console.log(`파싱서버 연결실패: ${err.code}`);
        resolve(null);
      });
    });
  }
  async getSites () {
    return new Promise((resolve, reject) => {
      const server = cache.setting.parsingServer;
      axios({
        url: `${server}/api/sites`,
        method: 'GET',
      }).then(res => {
        if (res.status === 200 && res.data.status) {
          const sites = res.data.sites;
          resolve(sites);
        } else {
          resolve([]);
        }
      }).catch(err => {
        console.log(`파싱서버 연결실패: ${err.code}`);
        resolve([]);
      });
    });
  }
  async getSite (siteId) {
    return new Promise((resolve, reject) => {
      console.log(siteId);
      const server = cache.setting.parsingServer;
      axios({
        url: `${server}/api/site/${siteId}`,
        method: 'GET',
      }).then(res => {
        if (res.status === 200 && res.data.status) {
          const site = res.data.site;
          resolve(site);
        } else {
          resolve(null);
        }
      }).catch(err => {
        console.log(`파싱서버 연결실패: ${err.code}`);
        resolve(null);
      });
    });
  }
  async getSitesByPagination () {
    return new Promise((resolve, reject) => {
      const server = cache.setting.parsingServer;
      axios({
        url: `${server}/api/site`,
        method: 'GET',
      }).then(res => {
        if (res.status === 200 && res.data.status) {
          console.log(res.data);
          resolve(true);
        } else {
          resolve(null);
        }
      }).catch(err => {
        console.log(`파싱서버 연결실패: ${err.code}`);
        resolve(null);
      });
    });
  }
  async createSite (data) {
    return new Promise((resolve, reject) => {
      const server = cache.setting.parsingServer;
      axios({
        url: `${server}/api/site/create`,
        method: 'POST',
        data,
      }).then(res => {
        if (res.status === 200 && res.data.status) {
          console.log(res.data);
          resolve(true);
        } else {
          resolve(null);
        }
      }).catch(err => {
        console.log(`파싱서버 연결실패: ${err.code}`);
        resolve(null);
      });
    });
  }
  async updateSite (siteId, data) {
    return new Promise((resolve, reject) => {
      const server = cache.setting.parsingServer;
      axios({
        url: `${server}/api/site/update/${siteId}`,
        method: 'POST',
        data,
      }).then(res => {
        if (res.status === 200 && res.data.status) {
          console.log(res.data);
          resolve(true);
        } else {
          resolve(null);
        }
      }).catch(err => {
        console.log(`파싱서버 연결실패: ${err.code}`);
        resolve(null);
      });
    });
  }
  async removeSite (siteId) {
    return new Promise((resolve, reject) => {
      const server = cache.setting.parsingServer;
      axios({
        url: `${server}/api/site/remove/${siteId}`,
        method: 'POST',
      }).then(res => {
        if (res.status === 200 && res.data.status) {
          console.log(res.data);
          resolve(true);
        } else {
          resolve(null);
        }
      }).catch(err => {
        console.log(`파싱서버 연결실패: ${err.code}`);
        resolve(null);
      });
    });
  }
  async createBoard () {

  }
  async updateBoard () {

  }
  async removeBoard () {

  }
}

module.exports = Parsing;