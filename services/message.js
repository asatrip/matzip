const Class = require('./class');
const datetime = require('../middleware/datetime');
const pagination = require('../middleware/pagination');

class Message extends Class {
  async getMessagesByPagination (data) {
    data = Object.assign({
      userId: null,
    }, data);
    const { userId } = data;
    let queryString = '';
    const queryArray = [];
    if (userId) {
      queryString += `AND m.message_recipient_ID = ?\n`;
      queryArray.push(userId);
    }
    const pnQuery = `SELECT count(*) AS count
    FROM message AS m
    LEFT JOIN user AS sender
    ON m.message_sender_ID = sender.id
    LEFT JOIN user AS recipient
    ON m.message_recipient_ID = recipient.id
    WHERE m.status >= 1
    ${queryString}
    `;
    const [pnResult, ] = await this.conn.query(pnQuery, queryArray);
    const pn = pagination(pnResult, this.req.query, 'page', 10);
    const query = `SELECT m.*, sender.nickName AS senderNickName, recipient.nickName AS recipientNickName
    FROM message AS m
    LEFT JOIN user AS sender
    ON m.message_sender_ID = sender.id
    LEFT JOIN user AS recipient
    ON m.message_recipient_ID = recipient.id
    WHERE m.status >= 1
    ${queryString}
    ORDER BY m.createdAt DESC
    ${pn.queryLimit}`;
    const [messages, ] = await this.conn.query(query, queryArray);
    messages.forEach(message => message.datetime = datetime(message.createdAt));
    return {
      messages,
      pn,
    };
  }
  async getMessages (user) {
    if (user) {
      const query = `SELECT m.*, u.nickName AS sender
      FROM message AS m
      LEFT JOIN user AS u
      ON message_sender_ID = u.id
      WHERE message_recipient_ID = ?
      AND m.status >= 1
      ORDER BY m.createdAt DESC`;
      const [messages, ] = await this.conn.query(query, [user.id]);
      messages.forEach(message => {
        message.datetime = datetime(message.createdAt);
        message.content = message.content?.replaceAll('\r\n', '<br>');
      });
      return messages;
    } else {
      throw new Error('입력값이 없습니다');
    }
  }
  async get (messageId) {
    const query = `SELECT m.*, u.nickName
    FROM message AS m
    LEFT JOIN user AS u
    ON message_sender_ID = u.id
    WHERE m.id = ?`;
    const [messages, ] = await this.conn.query(query, [messageId]);
    if (messages.length) {
      const message = messages[0];
      return message;
    } else {
      return null;
    }
  }
  async create (data) {

  }
  async update (messageId, data) {
    const message = await this.get(messageId);
    data = Object.assign({
      userId: message.message_user_ID,
      status: message.status,
    }, data);
    const {
      userId,
      status,
    } = data;
    let queryString = '';
    const queryArray = [];
    queryArray.push(status);
    queryArray.push(messageId);
    if (userId) {
      queryString += `AND message_recipient_ID = ?`;
      queryArray.push(userId);
    }
    const query = `UPDATE message
    SET status = ?
    WHERE id = ?
    ${queryString}`;
    await this.conn.query(query, queryArray);
  }
  async remove (messageId) {
    await this.conn.query(`UPDATE message SET status=0 WHERE id = ?`, [messageId]);
  }
}

module.exports = Message;