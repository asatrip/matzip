const admin = require('firebase-admin');
const config = require('../middleware/config');

const firebase = config.getFirebase();

class Push {
  constructor () {
    this.serviceAccount = firebase;
    this.admin.initializeApp({
      credential: admin.credential.cert(this.serviceAccount),
    });
  }
  async create (data) {
    data = Object.assign({
      user: null,
      title: null,
      content: null,
      url: '1',
    }, data);
    const { user, title, content, url } = data;
    if (user && title && content) {
      if (user.ios) {
        const message = {
          notification: {
            title,
            body: content,
          },
          data: {
            title,
            body: content,
            'path': url,
          },
          token: user.ios,
        };
        await this.send(message);
      }
      if (user.android) {
        const message = {
          data: {
            title,
            body: content,
            'path': url,
          },
          token: user.android,
        };
        await this.send(message);
      }
    } else {
      throw new Error('입력값이 부족합니다');
    }
  }
  async send () {
    return new Promise((resolve, reject) => {
      if (this.serviceAccount) {
        this.admin
        .messaging()
        .send(message)
        .then((response) => {
          console.log('푸시 보내기 성공: ', response);
          resolve(response);
        })
        .catch((err) => {
          console.error('푸시 보내기 실패: ', err);
          reject(err);
        });
      } else {
        throw new Error('Firebase 정보 미등록');
      }
    });
  }
}

module.exports = Push;