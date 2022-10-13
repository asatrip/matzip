const Class = require('./class');
const cache = require('./cache');

class Category extends Class {
  async getCategories (boardId) {
    const [categories, ] = await this.conn.query(`SELECT * FROM category WHERE category_board_id = ? ORDER BY viewOrder ASC, id ASC`, [boardId]);
    return categories;
  }
  async get (categoryId) {
    const [categories, ] = await this.conn.query(`SELECT * FROM category WHERE id = ?`, [categoryId]);
    if (categories.length) {
      const category = categories[0];
      return category;
    } else {
      return null;
    }
  }
  async set (boardId) {
    const categories = await this.getCategories(boardId);
    cache.boards.forEach(board => {
      if (board.id === Number(boardId)) {
        board.categories = categories;
      }
    });
  }
  async create (boardId, data) {
    data = Object.assign({
      title: null,
    }, data);
    const { title } = data;
    const query = `INSERT INTO category (category_board_ID, title) VALUES (?, ?)`;
    await this.conn.query(query, [boardId, title]);
    await this.set(boardId);
  }
  async update (categoryId, data) {
    const category = await this.get(categoryId);
    data = Object.assign({
      title: category.title,
      viewOrder: category.viewOrder,
    }, data);
    const { title, viewOrder } = data;
    await this.conn.query(`UPDATE category SET title = ?, viewOrder = ? WHERE id = ?`, [title, viewOrder, categoryId]);
    await this.set(category.category_board_ID);
  }
  async remove (categoryId) {
    const category = await this.get(categoryId);
    await this.conn.query(`DELETE FROM category WHERE id = ?`, [categoryId]);
    await this.set(category.category_board_ID);
  }
}

module.exports = Category;