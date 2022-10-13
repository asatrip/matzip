const Class = require('./class');
const hashCreate = require('../middleware/hash');
const cache = require('./cache');

class UserGroup extends Class {
  async getUserGroups (options) {
    const query = `SELECT *
    FROM userGroup
    ORDER BY viewOrder ASC, id DESC`;
    const [userGroups, ] = await this.conn.query(query);
    return userGroups;
  }
  async getUserGroupsByBoardId (boardId) {
    const query = `SELECT ug.*, ugb.listPermission, ugb.readPermission, ugb.writePermission, ugb.commentPermission
    FROM userGroup AS ug
    LEFT JOIN userGroupBoard AS ugb
    ON ugb.userGroupBoard_userGroup_ID = ug.id
    WHERE userGroupBoard_board_ID = ?`;
    const [userGroups, ] = await this.conn.query(query, [boardId]);
    return userGroups;
  }
  async get (userGroupId) {
    const [userGroups, ] = await this.conn.query(`SELECT * FROM userGroup WHERE id = ?`, [userGroupId]);
    if (userGroups.length) {
      const userGroup = userGroups[0];
      return userGroup;
    } else {
      return null;
    }
  }
  async set () {
    cache.userGroups = await this.getUserGroups();
  }
  async create (data) {
    data = Object.assign({
      title: null,
      slug: null,
    }, data);
    const { title, slug } = data;
    const hash = slug || hashCreate(6);
    const [result, ] = await this.conn.query(`INSERT INTO userGroup (title, slug) VALUES (?, ?)`, [title, hash]);
    if (result.insertId) {
      await this.set();
      return result.insertId;
    } else {
      return null;
    }
  }
  async update (userGroupId, data) {
    const userGroup = await this.get(userGroupId);
    data = Object.assign({
      title: userGroup.title,
      slug: userGroup.slug,
      viewOrder: userGroup.viewOrder,
    }, data);
    const { title, slug, viewOrder } = data;
    const hash = slug || hashCreate(6);
    await this.conn.query(`UPDATE userGroup SET title = ?, slug = ?, viewOrder = ? WHERE id = ?`, [title, hash, viewOrder, userGroupId]);
    await this.set();
  }
  async remove (userGroupId) {
    await this.conn.query(`DELETE FROM userGroup WHERE id = ?`, [userGroupId]);
    await this.set();
  }
}

module.exports = UserGroup;