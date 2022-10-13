const Class = require('./class');
const config = require('../middleware/config');
const storage = config.getStorageHost();
const pool = require('../middleware/database');
const datetime = require('../middleware/datetime');
const cache = require('./cache');

class Chat extends Class {
  async getChats () {
    const query = `SELECT c.*, u.nickName, u.permission, u.image AS userImage
    FROM chat AS c
    LEFT JOIN user AS u
    ON c.chat_user_ID = u.id
    WHERE c.status = 1
    ORDER BY c.id DESC
    LIMIT 20`;
    const [chatRaws, ] = await this.conn.query(query);
    const chats = [];
    chatRaws.reverse().forEach(chat => {
      chats.push(this.setInfo(chat));
    });
    return chats;
  }
  async get (chatId) {
    const query = `SELECT c.*, u.nickName, u.permission, u.image AS userImage
    FROM chat AS c
    LEFT JOIN user AS u
    ON c.chat_user_ID = u.id
    WHERE c.id = ?`;
    const [chats, ] = await this.conn.query(query, [chatId]);
    if (chats.length) {
      const chat = chats[0];
      return chat;
    } else {
      return null;
    }
  }
  async set () {
    cache.chats = await this.getChats();
  }
  async create (data) {
    const conn = await pool.getConnection();
    try {
      this.conn = conn;
      const { user, message } = data;
      const query = `INSERT INTO chat
      (chat_user_ID, message)
      VALUES (?, ?)`;
      const [result, ] = await conn.query(query, [user.id, message]);
      const chat = await this.get(result.insertId);
      cache.chats.push(this.setInfo(chat));
      return chat;
    } finally {
      conn.release();
    }
  }
  async update (chatId, data) {
    data = Object.assign({
      message: null,
    }, data);
    const { message } = data;
    await this.conn.query(`UPDATE chat SET message = ? WHERE id = ?`, [message, chatId]);
  }
  async remove (chatId) {
    await this.conn.query(`DELETE FROM chat WHERE id = ?`, [chatId]);
    await this.set();
  }
  async removeAll () {
    await this.conn.query(`DELETE FROM chat`);
    await this.set();
  }
  setInfo (chat) {
    const permission = cache.permissions.find(permission => permission.permission === chat.permission);
    if (permission?.image) {
      chat.permissionImage = `${storage}/permission/${permission.image}`;
    } else {
      chat.permissionImage = `/assets/permission/${chat.permission}.svg`;
    }
    if (chat.userImage) {
      chat.userImage = `${storage}/userImage/${chat.userImage}`;
    } else {
      chat.userImage = `/assets/userImage.svg`;
    }
    return {
      user: {
        id: chat.chat_user_ID,
        nickName: chat.nickName,
        permission: chat.permission,
        permissionImage: chat.permissionImage,
        userImage: chat.userImage,
      },
      message: chat.message,
      createdAt: chat.createdAt,
      time: datetime(chat.createdAt, 'time'),
    }
  }
}

module.exports = Chat;