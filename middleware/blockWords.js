const checkBlockWords = (blockWords = '', content) => {
  const blockWordsArray = blockWords ? blockWords.split(',').map(word => word.trim()).filter(blockWord => blockWord.length) : [];
  const result = Object.assign({
    status: true,
    word: null,
  });
  blockWordsArray.forEach(blockWord => {
    if (content.match(blockWord)) {
      result.status = false;
      result.word = blockWord;
    }
  });
  return result;
};

module.exports = checkBlockWords;