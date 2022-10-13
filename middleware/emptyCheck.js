const emptyCheck = (...args) => {
  for (let i = 0; i < args.length; i ++) {
    if (args[i] === '' || args[i].length === 0) {
      return false;
    }
  }
  return true;
}

module.exports = emptyCheck;