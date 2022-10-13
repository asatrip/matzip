const Class = require('./class');

class UserGroupBoard extends Class {
  async get (userGroupBoardId) {
    const [userGroupBoards, ] = await this.conn.query(`SELECT * FROM userGroupBoard WHERE id = ?`, [userGroupBoardId]);
    if (userGroupBoards.length) {
      const userGroupBoard = userGroupBoards[0];
      return userGroupBoard;
    } else {
      return null;
    }
  }
  async getById (boardId, userGroupId) {
    const [userGroupBoards, ] = await this.conn.query(`SELECT * FROM userGroupBoard WHERE userGroupBoard_board_ID = ? AND userGroupBoard_userGroup_ID = ?`, [boardId, userGroupId]);
    if (userGroupBoards.length) {
      const userGroupBoard = userGroupBoards[0];
      return userGroupBoard;
    } else {
      return null;
    }
  }
  async check (boardId, type) {
    const query = `SELECT uug.*, ugb.listPermission, ugb.readPermission, ugb.writePermission, ugb.commentPermission, b.useUserGroupPermission
    FROM userUserGroup AS uug
    LEFT JOIN userGroup AS ug
    ON uug.userUserGroup_userGroup_ID = ug.id
    LEFT JOIN userGroupBoard AS ugb
    ON ug.id = ugb.userGroupBoard_userGroup_ID
    LEFT JOIN board AS b
    ON ugb.userGroupBoard_board_ID = b.id
    WHERE uug.userUserGroup_user_ID = ? AND b.id = ?`;
    const [result, ] = await this.conn.query(query, [this.user?.id, boardId]);
    const board = result[0];
    if (!board?.useUserGroupPermission) {
      return true;
    } else if (type === 'listPermission' && board?.listPermission) {
      return true;
    } else if (type === 'readPermission' && board?.readPermission) {
      return true;
    } else if (type === 'writePermission' && board?.writePermission) {
      return true;
    } else if (type === 'commentPermission' && board?.commentPermission) {
      return true;
    }
    return false;
  }
  async create (data) {
    data = Object.assign({
      userGroupId: null,
      boardId: null,
    }, data);
    const { userGroupId, boardId } = data;
    if (userGroupId) {
      const boards = this.res.locals.boards;
      for await (let board of boards) {
        const userGroupBoard = await this.getById(board.id, userGroupId);
        if (!userGroupBoard) {
          await this.conn.query(`INSERT INTO userGroupBoard (userGroupBoard_userGroup_ID, userGroupBoard_board_ID) VALUES (?, ?)`, [userGroupId, board.id]);
        }
      }
    } else if (boardId) {
      const userGroups = this.res.locals.userGroups;
      for await (let userGroup of userGroups) {
        const userGroupBoard = await this.getById(boardId, userGroup.id);
        if (!userGroupBoard) {
          await this.conn.query(`INSERT INTO userGroupBoard (userGroupBoard_userGroup_ID, userGroupBoard_board_ID) VALUES (?, ?)`, [userGroup.id, boardId]);
        }
      }
    }
  }
  async update (boardId, userGroupId, data) {
    const userGroupBoard = await this.getById(boardId, userGroupId);
    data = Object.assign({
      listPermission: userGroupBoard.listPermission,
      readPermission: userGroupBoard.readPermission,
      writePermission: userGroupBoard.writePermission,
      commentPermission: userGroupBoard.commentPermission,
    }, data);
    const { listPermission, readPermission, writePermission, commentPermission } = data;
    await this.conn.query(`UPDATE userGroupBoard SET listPermission = ?, readPermission = ?, writePermission = ?, commentPermission = ? WHERE id = ?`, [listPermission, readPermission, writePermission, commentPermission, userGroupBoard.id]);
  }
}

module.exports = UserGroupBoard;