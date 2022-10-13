const crypto = require('crypto');

const hash = (number, type) => {
  const random = Math.random().toString();
  let text = null;
  if (type === undefined || type === 'md5_base64') {
    text = crypto.createHash('md5').update(random).digest('base64');
  } else if (type === 'md5_hex') {
    text = crypto.createHash('md5').update(random).digest('hex');
  } else if (type === 'sha256_base64') {
    text = crypto.createHash('sha256').update(random).digest('base64');
  } else if (type === 'sha256_hex') {
    text = crypto.createHash('sha256').update(random).digest('hex');
  } else if (type === 'sha512_base64') {
    text = crypto.createHash('sha512').update(random).digest('base64');
  } else if (type === 'sha512_hex') {
    text = crypto.createHash('sha512').update(random).digest('hex');
  }
  text = text
    .replaceAll(/[^A-z0-9]+/ig, '')
    .slice(0, number)
    .toLowerCase();
  return text;
};

module.exports = hash;