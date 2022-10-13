const { timezone } = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault(timezone);

const isNew = (inputDate) => {
  try {
    const now = moment();
    const result = now.diff(inputDate, 'h');
    if (result > 24) {
      return false;
    } else {
      return true;
    }
  } catch (e) {
    console.error(e);
  }
};

module.exports = isNew;