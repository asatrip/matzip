const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const Class = require('./class');

const config = require('../middleware/config');
const sql = config.getDatabase();

const options = {
  host: sql.host,
  port: sql.port,
  user: sql.user,
  password: sql.password,
  database: sql.database,
};

const sessionStore = new MySQLStore(options);

class SessionControl extends Class {
  constructor (req, res, conn) {
    super (req, res, conn);
    this.sessionStore = sessionStore;
  }
  getSessionStore () {
    return this.sessionStore;
  }
  getSessionIdByUserId (userId) {
    return new Promise(resolve => {
      let sessionIds = [];
      this.sessionStore.all((error, sessions) => {
        Object.keys(sessions).forEach(sessionId => {
          if (sessions[sessionId].user?.id === Number(userId)) {
            sessionIds.push(sessionId);
          }
        });
        resolve(sessionIds);
      });
    });
  }
  async updateUser (user) {
    return new Promise(async (resolve, reject) => {
      if (user) {
        const sessionIds = await this.getSessionIdByUserId(user.id);
        for await (let sessionId of sessionIds) {
          const session = await this.getSession(sessionId);
          if (session) {
            session.user = user;
            await this.setSession(sessionId, session);
          }
        }
        resolve(true);
      } else {
        reject('회원을 찾을 수 없습니다');
      }
    });
  }
  async getSession (sessionId) {
    return new Promise(resolve => {
      this.sessionStore.get(sessionId, async (err, session) => {
        if (session) {
          resolve(session);
        }
      });
    });
  }
  async setSession (key, session) {
    return new Promise(resolve => {
      this.sessionStore.set(key, session, () => {
        resolve(true);
      });
    });
  }
  async removeUser (userId) {
    const sessionId = await this.getSessionIdByUserId(userId);
    this.sessionStore.get(sessionId, (err, session) => {
      if (session) {
        this.sessionStore.destroy(sessionId);
      }
    });
  }
}

module.exports = SessionControl;