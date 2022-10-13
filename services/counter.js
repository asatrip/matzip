const { timezone } = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault(timezone);
const pool = require('../middleware/database');

class Count {
  async getCount () {
    const conn = await pool.getConnection();
    try {
      const thisDay = moment(new Date()).format('DD');
      const oneDayAgo = moment(new Date()).subtract(1, 'd').format('DD');
      const thisWeek = moment(new Date()).week();
      const thisMonth = moment(new Date()).format('MM');
      const todayQuery = `SELECT count(distinct ip) AS count
      FROM log
      WHERE date_format(CONVERT_TZ(createdAt, @@session.time_zone, '+09:00'), '%d') = ?`;
      const yesterdayQuery = `SELECT count(distinct ip) AS count
      FROM log
      WHERE date_format(CONVERT_TZ(createdAt, @@session.time_zone, '+09:00'), '%d') = ?`;
      const weekQuery = `SELECT count(distinct ip) AS count
      FROM log
      WHERE WEEK(CONVERT_TZ(createdAt, @@session.time_zone, '+09:00')) = ?`;
      const monthQuery = `SELECT count(distinct ip) AS count
      FROM log
      WHERE createdAt >= date_format(date_add(CONVERT_TZ(NOW(), @@session.time_zone, '+09:00'), interval -1 month), '%Y-%m-%d')`;
      const [todays, ] = await conn.query(todayQuery, [
        thisDay,
      ]);
      const [yesterdays, ] = await conn.query(yesterdayQuery, [
        oneDayAgo,
      ]);
      const [weeks, ] = await conn.query(weekQuery, [
        thisWeek,
      ]);
      const [months, ] = await conn.query(monthQuery, [
        thisMonth,
      ]);
      return {
        today: todays[0].count,
        yesterday: yesterdays[0].count,
        week: weeks[0].count,
        month: months[0].count,
      }
    } finally {
      conn.release();
    }
  }
}

module.exports = new Count();