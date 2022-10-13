const { google } = require('googleapis');
const AppleAuth = require('apple-auth');
const oauth = require('oauth');
const jwt = require('jsonwebtoken');
const axios = require('axios').default;
const queryString = require('query-string');
const hashCreate = require('../middleware/hash');
const Class = require('./class');
const cache = require('./cache');

class AppleLogin extends Class {
  constructor (req, res, conn) {
    super (req, res, conn);
  }
  getAppleAuth () {
    const setting = cache.setting;
    const config = {
      client_id: setting.socialAppleServiceId,
      team_id: setting.socialAppleTeamId,
      key_id: setting.socialAppleKeyId,
      redirect_uri: `${setting.siteDomain}/auth/apple/callback`,
      scope: 'name email',
    };
    this.appleAuth = new AppleAuth(config, setting.socialAppleAuthKey, 'text');
    return this.appleAuth;
  }
  getLoginUrl () {
    const appleAuth = this.getAppleAuth();
    return appleAuth.loginURL();
  }
  async auth (code) {
    const appleAuth = this.getAppleAuth();
    const response = await appleAuth.accessToken(code);
    const idToken = jwt.decode(response.id_token);
    if (idToken) {
      const user = {
        type: 'apple',
        id: idToken.sub,
        email: idToken.email,
      };
      return user;
    } else {
      throw new Error('토큰을 찾을 수 없습니다');
    }
  }
}

class GoogleLogin extends Class {
  constructor (req, res, conn) {
    super(req, res, conn);
  }
  getOauth2Client () {
    const setting = cache.setting;
    const oauth2Client = new google.auth.OAuth2(
      setting.socialGoogleClientId,
      setting.socialGoogleClientSecret,
      `${setting.siteDomain}/auth/google/callback`,
    );
    return oauth2Client;
  }
  getLoginUrl () {
    const oauth2Client = this.getOauth2Client();
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
    });
  }
  async auth (code) {
    const oauth2Client = this.getOauth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    const data = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`, {
      headers: {
        Authorization: `Bearer ${tokens.id_token}`,
      },
    })
    .then(res => res.data)
    .catch(error => {
      throw new Error(error.message);
    });
    if (data) {
      const user = {
        type: 'google',
        id: data.id,
        email: data.email,
      };
      return user;
    } else {
      throw new Error('토큰을 찾을 수 없습니다');
    }
  }
}

class FacebookLogin extends Class {
  constructor (req, res, conn) {
    super(req, res, conn);
  }
  getLoginUrl () {
    const setting = cache.setting;
    const stringifiedParams = queryString.stringify({
      client_id: setting.socialFacebookAppId,
      redirect_uri: `${setting.siteDomain}/auth/facebook/callback`,
      scope: ['email', 'user_friends'].join(','),
      response_type: 'code',
      auth_type: 'rerequest',
      display: 'popup',
    });

    const facebookLoginUrl = `https://www.facebook.com/v4.0/dialog/oauth?${stringifiedParams}`;
    return facebookLoginUrl;
  }
  async auth (code) {
    const accessToken = await this.getToken(code);
    const data = await this.getUser(accessToken);
    return data;
  }
  async getToken (code) {
    const setting = cache.setting;
    const { data } = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/v4.0/oauth/access_token',
      params: {
        client_id: setting.socialFacebookAppId,
        client_secret: setting.socialFacebookAppSecret,
        redirect_uri: `${setting.siteDomain}/auth/facebook/callback`,
        code,
      },
    });
    if (data?.access_token) {
      return data.access_token;
    } else {
      throw new Error('토큰을 찾을 수 없습니다');
    }
  }
  async getUser (accessToken) {
    const { data } = await axios({
      method: 'GET',
      url: 'https://graph.facebook.com/me',
      params: {
        fields: ['id', 'email', 'first_name', 'last_name'].join(','),
        access_token: accessToken,
      },
    });
    if (data) {
      const user = {
        type: 'facebook',
        id: data.id,
        email: data.email,
      };
      return user;
    } else {
      throw new Error('토큰을 찾을 수 없습니다');
    }
  }
}

class TwitterLogin extends Class {
  constructor (req, res, conn) {
    super(req, res, conn);
  }
  getOauthConsumer () {
    const setting = cache.setting;
    const oauthConsumer = new oauth.OAuth(
      'https://twitter.com/oauth/request_token',
      'https://twitter.com/oauth/access_token',
      setting.socialTwitterApiKey,
      setting.socialTwitterApiSecret,
      '1.0A',
      `${setting.siteDomain}/auth/twitter/callback`,
      'HMAC-SHA1',
    );
    return oauthConsumer;
  }
  async getLoginUrl () {
    const twitterLoginUrl = await this.getRequestToken(req);
    return twitterLoginUrl;
  }
  async auth (oauthVerifier) {
    const token = await this.getAccessToken(oauthVerifier);
    if (token) {
      const userRaw = await this.getUser(token);
      if (userRaw) {
        const user = {
          type: 'twitter',
          id: userRaw.id,
          email: userRaw.email || null,
        };
        return user;
      } else {
        throw new Error('토큰을 찾을 수 없습니다');
      }
    } else {
      throw new Error('토큰을 찾을 수 없습니다');
    }
  }
  async getRequestToken () {
    const oauthConsumer = this.getOauthConsumer();
    return new Promise((resolve, reject) => {
      oauthConsumer.getOAuthRequestToken((err, oauthToken, oauthTokenSecret, results) => {
        if (err) {
          reject(err);
        } else {
          this.req.session.oauthRequestToken = oauthToken;
          this.req.session.oauthRequestTokenSecret = oauthTokenSecret;
          resolve(`https://twitter.com/oauth/authorize?oauth_token=${this.req.session.oauthRequestToken}`);
        }
      });
    });
  }
  async getAccessToken (oauthVerifier) {
    return new Promise((resolve, reject) => {
      const oauthConsumer = this.getOauthConsumer();
      if (oauthConsumer) {
        oauthConsumer.getOAuthAccessToken(this.req.session.oauthRequestToken, this.req.session.oauthRequestTokenSecret, oauthVerifier, (err, oauthAccessToken, oauthAccessTokenSecret, results) => {
          if (err) {
            reject(err);
          } else {
            this.req.session.oauthAccessToken = oauthAccessToken;
            this.req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
            resolve({
              oauthAccessToken,
              oauthAccessTokenSecret,
            });
          }
        });
      } else {
        reject('토큰을 찾을 수 없습니다');
      }
    });
  }
  async getUser (token) {
    return new Promise((resolve, reject) => {
      if (token) {
        const {
          oauthAccessToken,
          oauthAccessTokenSecret,
        } = token;
        const oauthConsumer = this.getOauthConsumer();
        oauthConsumer.get('https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true', oauthAccessToken, oauthAccessTokenSecret, (err, data, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(JSON.parse(data));
          }
        });
      } else {
        reject('토큰을 찾을 수 없습니다');
      }
    });
  }
}

class NaverLogin extends Class {
  constructor (req, res, conn) {
    super(req, res, conn);
  }
  getLoginUrl () {
    const setting = cache.setting;
    const state = hashCreate(11);
    const socialNaverRedirect = `${setting.siteDomain}/auth/naver/callback`;
    const naverLoginUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${setting.socialNaverClientId}&redirect_uri=${socialNaverRedirect}&state=${state}`;
    return naverLoginUrl;
  }
  async auth (code, state) {
    const token = await this.getToken(code, state);
    const user = await this.getUser(token);
    return user;
  }
  async getToken (code, state) {
    const setting = cache.setting;
    const socialNaverRedirect = `${setting.siteDomain}/auth/naver/callback`;
    const token = await axios({
      method: 'GET',
      url: `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${setting.socialNaverClientId}&client_secret=${setting.socialNaverClientSecret}&redirect_uri=${socialNaverRedirect}&code=${code}&state=${state}`,
      headers: {
        'X-Naver-Client-Id': setting.socialNaverClientId,
        'X-Naver-Client-Secret': setting.socialNaverClientSecret,
      },
    }).then(res => res.data)
    .catch(e => {
      throw new Error(e);
    });

    return token;
  }
  async getUser (token) {
    if (token) {
      const userRaw = await axios({
        method: 'POST',
        url: 'https://openapi.naver.com/v1/nid/me',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      })
      .then(res => res.data)
      .catch(e => {
        throw new Error(e);
      });
      
      let user = null;
      if (userRaw) {
        const data = userRaw.response;
        user = {
          type: 'naver',
          id: data.id,
          email: data.email,
        };
      }
      return user;
    } else {
      throw new Error('토큰을 찾을 수 없습니다');
    }
  }
}

class KakaoLogin extends Class {
  constructor (req, res, conn) {
    super(req, res, conn);
  }
  getLoginUrl () {
    const setting = cache.setting;
    const socialKakaoRedirect = `${setting.siteDomain}/auth/kakao/callback`;
    const kakaoLoginUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${setting.socialKakaoClientId}&redirect_uri=${socialKakaoRedirect}&response_type=code&scope=account_email`;
    return kakaoLoginUrl;
  }
  async auth (code) {
    const token = await this.getToken(code);
    const user = await this.getUser(token);
    return user;
  }
  async getToken (code) {
    const setting = cache.setting;
    const token = await axios({
      method: 'POST',
      url: 'https://kauth.kakao.com/oauth/token',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: queryString.stringify({
        grant_type: 'authorization_code',
        client_id: setting.socialKakaoClientId,
        client_secret: setting.socialKakaoClientSecret,
        redirectUri: `${setting.siteDomain}/auth/kakao/callback`,
        code,
      }),
    })
    .then(res => res.data)
    .catch(e => {
      throw new Error(e);
    });
    return token;
  }
  async getUser (token) {
    if (token?.access_token) {
      const userRaw = await axios({
        method: 'GET',
        url: 'https://kapi.kakao.com/v2/user/me',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      }).then(res => res.data)
      .catch(e => {
        throw new Error(e);
      });
      let user = null;
      if (userRaw) {
        user = {
          type: 'kakao',
          id: userRaw.id,
          email: userRaw.kakao_account.email,
        };
      }
      return user;
    } else {
      throw new Error('토큰을 찾을 수 없습니다');
    }
  }
}

module.exports = {
  AppleLogin,
  GoogleLogin,
  FacebookLogin,
  TwitterLogin,
  NaverLogin,
  KakaoLogin,
};