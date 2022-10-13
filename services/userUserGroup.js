const Class = require('./class');

class UserUserGroup extends Class {
  async get (userUserGroupId) {
    const [userUserGroups, ] = await this.conn.query(`SELECT * FROM userUserGroup WHERE id = ?`, [userUserGroupId]);
    if (userUserGroups.length) {
      const userUserGroup = userUserGroups[0];
      return userUserGroup;
    } else {
      return null;
    }
  }
  async getUserUserGroups (userId) {
    const query = `SELECT *
    FROM userUserGroup
    WHERE userUserGroup_user_ID = ?`;
    const [userUserGroups, ] = await this.conn.query(query, [userId]);
    return userUserGroups;
  }
  async set (userId, userGroups) {
    await this.conn.query(`DELETE FROM userUserGroup WHERE userUserGroup_user_ID = ?`, [userId]);
    if (typeof userGroups === 'string') {
      await this.conn.query(`INSERT INTO userUserGroup (userUserGroup_user_ID, userUserGroup_userGroup_ID) VALUES (?, ?)`, [userId, userGroups]);
    } else if (typeof userGroups === 'object') {
      for await (let userGroup of userGroups) {
        await this.conn.query(`INSERT INTO userUserGroup (userUserGroup_user_ID, userUserGroup_userGroup_ID) VALUES (?, ?)`, [userId, userGroup]);
      }
    } else if (userGroups === undefined) {
      await this.conn.query(`DELETE FROM userUserGroup WHERE userUserGroup_user_ID = ?`, [userId]);
    }
  }
}

module.exports = UserUserGroup;