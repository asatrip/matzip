const getIp = req => {
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
  if (!ip.match('127.0.0.1')) {
    return ip;
  } else {
    return null;
  }
};

module.exports = getIp;