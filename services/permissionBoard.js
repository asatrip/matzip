const Class = require('./class');
const cache = require('./cache');

class PermissionBoard extends Class {
  async getPermissions (boardId) {
    const query = `SELECT pb.*, p.permission
    FROM permissionBoard AS pb
    LEFT JOIN permission AS p
    ON pb.permissionBoard_permission_ID = p.id 
    WHERE pb.permissionBoard_board_ID = ?`;
    const [permissions, ] = await this.conn.query(query, [
      boardId,
    ]);
    return permissions;
  }
  async get (permissionBoardId) {
    const query = `SELECT *
    FROM permissionBoard
    WHERE id = ?`;
    const [permissionBoards, ] = await this.conn.query(query, [
      permissionBoardId,
    ]);
    if (permissionBoards.length) {
      const permissionBoard = permissionBoards[0];
      return permissionBoard;
    } else {
      return null;
    }
  }
  async getById (boardId, permissionId) {
    const query = `SELECT *
    FROM permissionBoard
    WHERE permissionBoard_board_ID = ?
    AND permissionBoard_permission_ID = ?`;
    const [permissionBoards, ] = await this.conn.query(query, [
      boardId,
      permissionId,
    ]);
    if (permissionBoards.length) {
      const permissionBoard = permissionBoards[0];
      return permissionBoard;
    } else {
      return null;
    }
  }
  async set () {
    for await (let board of cache.boards) {
      board.permissions = await this.getPermissions(board.id);
    }
  }
  async check (boardId) {
    const board = this.res.locals.boards.find(board => board.id === boardId);
    const user = this.res.locals.user;
    const permission = board.permissions.find(permission => permission.permission === user.permission);
    if (permission) {
      let queryString = '';
      let message = '글쓰기 갯수 제한';
      if (permission.articleLimitType === 'none' || permission.articleLimitCount === 0) {
        return {
          status: true,
        };
      } else if (permission.articleLimitType === 'day') {
        queryString += `AND a.createdAt >= date_format(date_add(NOW(), INTERVAL -1 DAY), '%Y-%m-%d')\n`;
        message = `이 게시판은 하루 ${permission.articleLimitCount} 개의 게시글만 작성 가능합니다`;
      } else if (permission.articleLimitType === 'week') {
        queryString += `AND a.createdAt >= date_format(date_add(NOW(), INTERVAL -7 DAY), '%Y-%m-%d')\n`;
        message = `이 게시판은 일주일 ${permission.articleLimitCount} 개의 게시글만 작성 가능합니다`;
      } else if (permission.articleLimitType === 'month') {
        queryString += `AND a.createdAt >= date_format(date_add(NOW(), INTERVAL -30 DAY), '%Y-%m-%d')\n`;
        message = `이 게시판은 한달 ${permission.articleLimitCount} 개의 게시글만 작성 가능합니다`;
      } else if (permission.articleLimitType === 'infinite') {
        queryString += `AND a.createdAt >= date_format(date_add(NOW(), INTERVAL -1 DAY), '%Y-%m-%d')\n`;
        message = `이 게시판은 한번만 작성 가능합니다`;
      }
      const query = `SELECT a.*
      FROM article AS a
      LEFT JOIN board AS b
      ON a.article_board_ID = b.id
      WHERE b.id = ? AND a.status = 2
      `;
      const [articles, ] = await this.conn.query(query, [
        board.id,
      ]);
      if (articles.length >= permission.articleLimitCount) {
        return {
          status: false,
          message,
        };
      } else {
        return {
          status: true,
        };
      }
    } else {
      return {
        status: false,
        message: '등급별 제한 테이블이 생성되있지 않습니다',
      };
    }
  }
  async create (data) {
    data = Object.assign({
      permissionId: null,
      boardId: null,
    }, data);
    const {
      permissionId,
      boardId,
    } = data;
    if (permissionId) {
      const boards = this.res.locals.boards;
      for await (let board of boards) {
        const permissionBoard = await this.getById(board.id, permissionId);
        if (!permissionBoard) {
          const query = `INSERT INTO permissionBoard
          (permissionBoard_permission_ID, permissionBoard_board_ID)
          VALUES (?, ?)`;
          await this.conn.query(query, [
            permissionId,
            board.id,
          ]);
        }
      }
    } else if (boardId) {
      const permissions = this.res.locals.permissions;
      for await (let permission of permissions) {
        const permissionBoard = await this.getById(boardId, permission.id);
        if (!permissionBoard) {
          const query = `INSERT INTO permissionBoard
          (permissionBoard_permission_ID, permissionBoard_board_ID)
          VALUES (?, ?)`;
          await this.conn.query(query, [
            permission.id,
            boardId,
          ]);
        }
      }
    }
    await this.set();
  }
  async update (boardId, permissionId, data) {
    const permissionBoard = await this.getById(boardId, permissionId);
    // console.log(data);
    data = Object.assign({
      articleLimitType: permissionBoard.articleLimitType,
      articleLimitCount: permissionBoard.articleLimitCount,
    }, data);
    const {
      articleLimitType,
      articleLimitCount,
    } = data;
    // console.log(articleLimitType, articleLimitCount);
    const query = `UPDATE permissionBoard
    SET
    articleLimitType = ?,
    articleLimitCount = ?
    WHERE id = ?`;
    await this.conn.query(query, [
      articleLimitType,
      articleLimitCount,
      permissionBoard.id,
    ]);
    await this.set();
  }
}

module.exports = PermissionBoard;