const Class = require('./class');
const cache = require('./cache');

class Permission extends Class {
  async getPermissions () {
    const [permissions, ] = await this.conn.query(`SELECT * FROM permission ORDER BY permission ASC`);
    return permissions;
  }
  async getPermissionsByBoardId (boardId) {
    const query = `SELECT p.*, pb.articleLimitType, pb.articleLimitCount
    FROM permission AS p
    LEFT JOIN permissionBoard AS pb
    ON pb.permissionBoard_permission_ID = p.id
    WHERE permissionBoard_board_ID = ?`;
    const [permissions, ] = await this.conn.query(query, [
      boardId,
    ]);
    return permissions;
  }
  async get (permissionId) {
    const [permissions, ] = await this.conn.query(`SELECT * FROM permission WHERE id = ?`, [permissionId]);
    if (permissions.length) {
      return permissions[0];
    } else {
      return null;
    }
  }
  async set () {
    cache.permissions = await this.getPermissions();
  }
  async create (data) {
    data = Object.assign({
      permission: null,
      title: null,
      isAdmin: false,
    }, data);
    const { permission, title, isAdmin } = data;
    const [result, ] = await this.conn.query(`INSERT INTO permission (permission, title, isAdmin) VALUES (?, ?, ?)`, [permission, title, isAdmin]);
    if (result.insertId) {
      await this.set();
      return result.insertId;
    } else {
      throw new Error('등록 실패');
    }
  }
  async update (permissionId, data) {
    const permission = await this.get(permissionId);
    data = Object.assign({
      title: permission.title,
      pointBaseline: permission.pointBaseline,
      isManager: permission.isManager,
      isAdmin: permission.isAdmin,
    }, data);
    const { title, pointBaseline, isManager, isAdmin } = data;
    const query = `UPDATE permission
    SET title = ?, pointBaseline = ?, isManager = ?, isAdmin = ?
    WHERE id = ?`;
    await this.conn.query(query, [title, pointBaseline, isManager, isAdmin, permissionId]);
    await this.set();
  }
  async remove (permissionId) {
    await this.conn.query(`DELETE FROM permission WHERE id = ?`, [permissionId]);
    await this.set();
  }
  async check (user) {
    const permissions = this.res.locals.permissions;
    if (!user.isManager && !user.isAdmin && user.permission !== 0 && user.permission !== null && !user.workingUser) {
      const currentPermission = this.getCurrentPermission(user, permissions, this.setting);
      if (user.permission !== currentPermission) {
        await this.conn.query(`UPDATE user SET permission = ? WHERE id = ?`, [currentPermission, user.id]);
      }
    }
  }
  getCurrentPermission (user, permissions, setting) {
    let currentPermission = 1;
    let point = null;
    if (setting.autoPermissionType === 1) point = user.point;
    else point = user.maxPoint;
    for (let i = 0; i < permissions.length; i ++) {
      if (point >= permissions[i].pointBaseline && permissions[i].pointBaseline !== 0 && !permissions[i].isAdmin) {
        currentPermission = permissions[i].permission;
      }
    }
    return currentPermission;
  }
}

module.exports = Permission;