const Class = require('./class');

class Tag extends Class {
  async getTags (articleId, options) {
    options = Object.assign({
      combine: false,
    }, options);
    const { combine } = options;
    const query = `SELECT t.*
    FROM tag AS t
    LEFT JOIN articleTag AS at
    ON t.id = at.articleTag_tag_ID
    WHERE at.articleTag_article_ID = ?`;
    const [tags, ] = await this.conn.query(query, [articleId]);
    if (combine) {
      return this.combineTags(tags);
    } else {
      return tags;
    }
  }
  async set (articleId, tags) {
    tags = this.splitTag(tags);
    await this.conn.query(`DELETE FROM articleTag WHERE articleTag_article_ID = ?`, [articleId]);
    for await (let tag of tags) {
      const tagId = await this.create(tag);
      const [duplicateResult, ] = await this.conn.query(`SELECT * FROM articleTag WHERE articleTag_article_ID = ? AND articleTag_tag_ID = ?`, [articleId, tagId]);
      if (!duplicateResult.length) {
        await this.conn.query(`INSERT INTO articleTag (articleTag_article_ID, articleTag_tag_ID) VALUES (?, ?)`, [articleId, tagId]);
      }
    }
  }
  async get (key) {
    const [tags, ] = await this.conn.query(`SELECT * FROM tag WHERE \`key\` = ?`, [key]);
    if (tags.length) {
      const tag = tags[0];
      return tag;
    } else {
      return null;
    }
  }
  async create (key) {
    const oldKey = await this.get(key);
    if (!oldKey) {
      const [result, ] = await this.conn.query(`INSERT INTO tag (\`key\`) VALUES (?)`, [key]);
      if (result.insertId) {
        return result.insertId;
      } else {
        return null;
      }
    } else {
      return oldKey.id;
    }
  }
  async remove () {
    
  }
  splitTag (tagRaws) {
    const tags = tagRaws ? tagRaws
      .split(/[#,\s]+/)
      .map(word => word.trim())
      .filter(tag => tag.length) : [];
    return tags;
  }
  combineTags (tagRaws) {
    let tags = '';
    tagRaws.forEach((tagRaw, index) => {
      console.log(index);
      tags += tagRaw.key;
      if (index !== tagRaws.length - 1) tags += `, `;
    });
    return tags;
  }
}

module.exports = Tag;