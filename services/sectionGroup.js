const Class = require('./class');
const cache = require('./cache');
const Section = require('./section');

class SectionGroup extends Class {
  async getSectionGroups (options) {
    options = Object.assign({
      getSections: false,
    }, options);
    const {
      getSections,
    } = options;
    const query = `SELECT *
    FROM sectionGroup
    ORDER BY viewOrder ASC, id ASC`;
    const [sectionGroups, ] = await this.conn.query(query);
    if (getSections) {
      const sectionClass = new Section(this.req, this.res, this.conn);
      const sections = await sectionClass.getSections();
      sectionGroups.forEach(sectionGroup => {
        sectionGroup.sections = sections.filter(section => section.section_sectionGroup_ID === sectionGroup.id);
      });
    }
    return sectionGroups;
  }
  async get (sectionGroupId) {
    const [sectionGroups, ] = await this.conn.query(`SELECT * FROM sectionGroup WHERE id = ?`, [sectionGroupId]);
    if (sectionGroups.length) {
      const sectionGroup = sectionGroups[0];
      return sectionGroup;
    } else {
      return false;
    }
  }
  async set () {
    cache.sectionGroups = await this.getSectionGroups({
      getSections: true,
    });
  }
  async create (data) {
    data = Object.assign({
      type: null,
    }, data);
    const {
      type,
    } = data;
    const query = `INSERT INTO sectionGroup
    (type)
    VALUES (?)`;
    const [result, ] = await this.conn.query(query, [
      type,
    ]);
    if (result.insertId) {
      await this.set();
      return result.insertId;
    } else {
      return null;
    }
  }
  async update (sectionGroupId, data) {
    const sectionGroup = await this.get(sectionGroupId);
    data = Object.assign({
      type: sectionGroup.type,
      viewOrder: sectionGroup.viewOrder,
      title: sectionGroup.title,
      content: sectionGroup.content,
      status: sectionGroup.status,
    }, data);
    const {
      type,
      viewOrder,
      title,
      content,
      showTitleAndContent,
      status,
    } = data;
    const query = `UPDATE sectionGroup
    SET
    type = ?,
    viewOrder = ?,
    title = ?,
    content = ?,
    showTitleAndContent = ?,
    status = ?
    WHERE id = ?`;
    await this.conn.query(query, [
      type,
      viewOrder,
      title,
      content,
      showTitleAndContent,
      status,
      sectionGroupId,
    ]);
    await this.set();
  }
  async remove (sectionGroupId) {
    const query = `DELETE FROM sectionGroup
    WHERE id = ?`;
    await this.conn.query(query, [
      sectionGroupId,
    ]);
    await this.set();
  }
}

module.exports = SectionGroup;