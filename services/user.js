const bcrypt = require('bcrypt');
const flash = require('../middleware/flash');
const hashCreate = require('../middleware/hash');
const pagination = require('../middleware/pagination');
const Class = require('./class');
const Email = require('./email');
const Phone = require('./phone');
const SessionControl = require('./session');
const config = require('../middleware/config');
const cache = require('./cache');

const SALT_COUNT = 10;

class User extends Class {
  async login (data) {
    data = Object.assign({
      email: null,
      password: null,
    }, data);
    const {
      email,
      password,
    } = data;
    const user = await this.get({
      email,
    });
    if (user) {
      const passwordCheckResult = await this.passwordCheck(user, password);
      if (passwordCheckResult) {
        await this.update(user.id, {
          lastLogin: new Date(),
        });
        return user;
      } else {
        throw new Error('비밀번호가 일치하지 않습니다');
      }
    } else {
      throw new Error('이메일이 존재하지 않습니다');
    }
  }
  async getUsersByPagination (data, listCount) {
    data = Object.assign({
      searchType: null,
      keyword: null,
    }, data);
    const {
      searchType,
      keyword,
    } = data;
    let queryString = '';
    const queryArray = [];
    if (searchType === 'email') {
      queryString = `AND email LIKE CONCAT('%',?,'%')\n`;
      queryArray.push(keyword);
    } else if (searchType === 'nickName') {
      queryString = `AND nickName LIKE CONCAT('%',?,'%')\n`;
      queryArray.push(keyword);
    } else if (searchType === 'phone') {
      queryString = `AND phone LIKE CONCAT('%',?,'%')\n`;
      queryArray.push(keyword);
    }
    const pnQuery = `SELECT count(*) AS count
    FROM user
    WHERE status = 1
    ${queryString}
    `;
    const [pnResult, ] = await this.conn.query(pnQuery, queryArray);
    const pn = pagination(pnResult, this.req.query, 'page', listCount);
    const query = `SELECT *
    FROM user
    WHERE status = 1
    ${queryString}
    ORDER BY id DESC
    ${pn.queryLimit}`;
    const [users, ] = await this.conn.query(query, queryArray);
    return {
      users,
      pn,
    };
  }
  async getUsers () {
    const [users, ] = await this.conn.query(`SELECT * FROM user`);
    return users;
  }
  async getTotalCount () {
    const [userCountResult, ] = await this.conn.query(`SELECT count(*) AS count FROM user`);
    const userCount = userCountResult[0].count;
    return userCount;
  }
  async get (userInfo) {
    userInfo = Object.assign({
      id: null,
      email: null,
      nickName: null,
    }, userInfo);
    const {
      id,
      email,
      nickName,
    } = userInfo;
    let queryString = '';
    const queryArray = [];
    if (id || email || nickName) {
      if (id) {
        queryString += `WHERE u.id = ?\n`;
        queryArray.push(id);
      } else if (email) {
        queryString += `WHERE u.email = ?\n`;
        queryArray.push(email);
      } else if (nickName) {
        queryString += `WHERE u.nickName = ?\n`;
        queryArray.push(nickName);
      }
      const query = `SELECT u.*, p.permission AS permission, p.title AS permissionName, p.isManager, p.isAdmin
      FROM user AS u
      LEFT JOIN permission AS p
      ON u.permission = p.permission
      ${queryString}`;
      const [users, ] = await this.conn.query(query, queryArray);
      if (users.length) {
        const user = users[0];
        return this.setInfo(user);
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
  async getAdminUser () {
    const query = `SELECT u.*
    FROM user AS u
    LEFT JOIN permission AS p
    ON u.permission = p.permission
    WHERE p.isAdmin = 1`;
    const [users, ] = await this.conn.query(query);
    return users;
  }
  async getPointRanks (options) {
    options = Object.assign({
      date: null,
    }, options);
    const { date } = options;
    let queryString = '';
    if (date === 'today') {
      queryString += `WHERE p.createdAt >= date_format(date_add(NOW(), INTERVAL -1 DAY), '%Y-%m-%d')\n`;
    } else if (date === 'week') {
      queryString += `WHERE p.createdAt >= date_format(date_add(NOW(), INTERVAL -7 DAY), '%Y-%m-%d')\n`;
    } else if (date === 'month') {
      queryString += `WHERE p.createdAt >= date_format(date_add(NOW(), INTERVAL -30 DAY), '%Y-%m-%d')\n`;
    } else if (date === 'total' || date === undefined) {
      // queryString += `\n`;
    }
    const query = `SELECT u.nickName, u.permission, u.image, sum(p.point) AS point
    FROM point AS p
    LEFT JOIN user AS u
    ON p.point_user_ID = u.id
    ${queryString}
    GROUP BY point_user_ID
    ORDER BY point DESC`;
    let number = 1;
    const [ranks, ] = await this.conn.query(query);
    ranks.forEach(rank => {
      rank.number = number ++;
      rank = this.setInfo(rank);
    });
    return ranks;
  }
  async create (data) {
    data = Object.assign({
      email: null,
      password: null,
      nickName: null,
      permission: 1,
      workingUser: 0,
      emailAuthentication: 0,
      phone: null,
      realName: null,
      appleId: null,
      googleId: null,
      facebookId: null,
      twitterId: null,
      naverId: null,
      kakaoId: null,
      encrypt: true,
    }, data);
    const {
      email,
      password,
      nickName,
      permission,
      workingUser,
      emailAuthentication,
      phone,
      realName,
      appleId,
      googleId,
      facebookId,
      twitterId,
      naverId,
      kakaoId,
      encrypt,
    } = data;
    const emailQuery = `SELECT * FROM user WHERE email = ?`;
    const [emailResult, ] = await this.conn.query(emailQuery, email);
    if (!emailResult.length) {
      const nickNameQuery = `SELECT * FROM user WHERE nickName = ?`;
      const [nickNameResult, ] = await this.conn.query(nickNameQuery, nickName);
      if (!nickNameResult.length) {
        const salt = bcrypt.genSaltSync(SALT_COUNT);
        let hash = null;
        encrypt ? hash = bcrypt.hashSync(password, salt) : hash = password;
        const query = `INSERT INTO user
        (
          email,
          password,
          nickName,
          permission,
          workingUser,
          emailAuthentication,
          phone,
          realName,
          appleId,
          googleId,
          facebookId,
          twitterId,
          naverId,
          kakaoId
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result, ] = await this.conn.query(query, [
          email,
          hash,
          nickName,
          permission,
          workingUser,
          emailAuthentication,
          phone,
          realName,
          appleId,
          googleId,
          facebookId,
          twitterId,
          naverId,
          kakaoId,
        ]);
        if (result.insertId) {
          const user = await this.get({
            id: result.insertId,
          });
          return user;
        } else {
          throw new Error('회원 등록에 실패하였습니다');
        }
      } else {
        throw new Error('닉네임 중복입니다');
      }
    } else {
      throw new Error('이메일 중복입니다');
    }
  }
  async checkout (user) {
    const {
      phone,
      inviteId,
    } = this.req.body;

    // 이메일 인증
    const hash = hashCreate(11);
    const [oldHash, ] = await this.conn.query(`SELECT * FROM authentication WHERE authentication_user_ID = ? AND type = ?`, [user.id, 'email']);
    if (oldHash.length) await this.conn.query(`DELETE FROM authentication WHERE authentication_user_ID = ? AND type = ?`, [user.id, 'email']);
    await this.conn.query(`INSERT INTO authentication (authentication_user_ID, type, hash) VALUES (?, ?, ?)`, [user.id, 'email', hash]);
    
    const socialLogin = user?.appleId || user?.googleId || user?.facebookId || user?.twitterId || user?.naverId || user?.kakaoId;
    if (this.res.locals.setting.gmailUser && !socialLogin) {
      const emailClass = new Email(this.req, this.res, this.conn);
      try {
        emailClass.create(user.email, {
          subject: `이메일 인증 - ${this.res.locals.setting.siteName}`,
          content: `
          <h1>이메일 인증 - ${this.res.locals.setting.siteName}</h1>
          <hr>
          <p>${user.nickName} 님의 이메일 인증번호</p><p style="font-weight: bold;">${hash}</p>`,
        });
      } catch (e) {
        throw new Error(e.message);
      }
    }

    // SMS 인증
    if (phone && this.res.locals.setting.useSmsAuthentication) {
      const authNumber = Math.random().toString().slice(3, 7);
      const query = `INSERT INTO authentication
      (authentication_user_ID, type, hash)
      VALUES (?, ?, ?)`;
      await this.conn.query(query, [user.id, 'sms', authNumber]);
      const phoneClass = new Phone(this.req, this.res, this.conn);
      await phoneClass.create(user.phone, `[${this.res.locals.setting.siteNameRaw}] 인증번호는 ${authNumber} 입니다`);
    }

    // 초대 포인트 지급
    if (inviteId) {
      const [inviteUsers, ] = await this.conn.query(`SELECT * FROM user WHERE nickName = ?`, [inviteId]);
      if (inviteUsers.length) {
        const inviteUser = inviteUsers[0];
        const invitePoint = this.setting.invitePoint;
        if (invitePoint !== 0) {
          await this.conn.query(`UPDATE user SET point=point+? WHERE id = ?`, [invitePoint, inviteUser.id]);
          await this.conn.query(`INSERT INTO point (point_user_ID, type, point) VALUES (?, ?, ?)`, [inviteUser.id, 'invite', invitePoint]);
        }
      }
    }
  }
  async update (userId, data) {
    const user = await this.get({ id: userId });
    data = Object.assign({
      email: user.email,
      password: null,
      nickName: user.nickName,
      image: user.image,
      phone: user.phone,
      realName: user.realName,
      permission: user.permission,
      workingUser: user.workingUser,
      checkTotal: user.checkTotal,
      lastLogin: user.lastLogin,
      status: user.status,
    }, data);
    const {
      email,
      password,
      nickName,
      image,
      phone,
      realName,
      permission,
      workingUser,
      checkTotal,
      lastLogin,
      status,
    } = data;
    let queryString = '';
    const queryArray = [];
    queryArray.push(email);
    if (password) {
      const salt = bcrypt.genSaltSync(SALT_COUNT);
      const hash = bcrypt.hashSync(password, salt);
      queryString += `password = ?,\n`;
      queryArray.push(hash);
    }
    queryArray.push(nickName);
    queryArray.push(image);
    queryArray.push(phone);
    queryArray.push(realName);
    queryArray.push(permission);
    queryArray.push(workingUser);
    queryArray.push(checkTotal);
    queryArray.push(lastLogin);
    queryArray.push(status);
    queryArray.push(userId);
    const query = `UPDATE user
    SET
    email = ?,
    ${queryString}
    nickName = ?,
    image = ?,
    phone = ?,
    realName = ?,
    permission = ?,
    workingUser = ?,
    checkTotal = ?,
    lastLogin = ?,
    status = ?
    WHERE id = ?`;
    await this.conn.query(query, queryArray);
    const newDataUser = await this.get({
      id: userId,
    });
    const sessionControl = new SessionControl(this.req, this.res, this.conn);
    await sessionControl.updateUser(newDataUser);
  }
  async remove (userId) {
    const query = `DELETE FROM user
    WHERE id = ?`;
    await this.conn.query(query, [
      userId,
    ]);
    const sessionControl = new SessionControl(this.req, this.res, this.conn);
    await sessionControl.removeUser(userId);
  }
  async passwordCheck (user, password) {
    const result = bcrypt.compareSync(password, user.password);
    return result;
  }
  setInfo (user) {
    // 회원 등급 이미지
    const permissionImage = cache.permissions.find(permission => permission.permission === user.permission && permission.image);
    if (permissionImage) {
      user.permissionImage = `${cache.storage}/permission/${permissionImage.image}`;
    } else if (user.permission) {
      user.permissionImage = `/assets/permission/${user.permission}.svg`;
    } else {
      user.permissionImage = `/assets/permission/0.svg`;
    }

    return user;
  }
  async authCheckout (authUserData) {
    if (authUserData?.email) {
      const { type, id, email } = authUserData;
      const [socialIdResult, ] = await this.conn.query(`SELECT * FROM user WHERE ${type}Id = ?`, [id]);
      if (socialIdResult.length) { // 로그인
        const user = await this.get({
          id: socialIdResult[0].id,
        });
        return {
          user,
          type: 'login',
        };
      } else { // 회원가입
        // 이메일 조회
        const user = await this.get({ email });
        if (user) { // 기존 유저에 소셜 아이디만 추가
          const [result, ] = await this.conn.query(`UPDATE user SET ${type}Id = ?, emailAuthentication = ? WHERE id = ?`, [id, 1, user.id]);
          if (result.affectedRows) {
            // 로그인 처리
            const user = await this.get({
              email,
            });
            return {
              user,
              type: 'login',
            };
          } else {
            return null;
          }
        } else { // 유저 신규 생성
          const data = {
            email: email,
            password: hashCreate(8),
            nickName: hashCreate(6),
          };
          switch (type) {
            case 'apple':
              data.appleId = id;
              break;
            case 'google':
              data.googleId = id;
              break;
            case 'facebook':
              data.facebookId = id;
              break;
            case 'twitter':
              data.twitterId = id;
              break;
            case 'naver':
              data.naverId = id;
              break;
            case 'kakao':
              data.kakaoId = id;
              break;
          }
          const user = await this.create(data);
          return {
            user,
            type: 'join',
          };
        }
      }
    } else {
      if (!userInfo) {
        throw new Error('유저 정보가 존재하지 않습니다');
      } else if (!userInfo.email) {
        throw new Error('유저 이메일이 존재하지 않습니다');
      } else {
        throw new Error('로그인에 실패했습니다');
      }
    }
  }
}

module.exports = User;