const getPages = () => {
  const pagesRaw = document.querySelector('input[name="pages"]')?.value;
  if (pagesRaw) {
    const pages = JSON.parse(pagesRaw);
    return pages;
  } else {
    return null;
  }
};

const getGos = () => {
  const gosRaw = document.querySelector('input[name="gos"]')?.value;
  if (gosRaw) {
    const gos = JSON.parse(gosRaw);
    return gos;
  } else {
    return null;
  }
};

const getUser = () => {
  const publicUserRaw = document.querySelector('input[name="publicUser"]')?.value;
  if (publicUserRaw) {
    const publicUser = JSON.parse(publicUserRaw);
    return publicUser;
  } else {
    return null;
  }
};

const getChats = () => {
  const publicChatsRaw = document.querySelector('input[name="publicChats"]')?.value;
  if (publicChatsRaw) {
    const publicChats = JSON.parse(publicChatsRaw);
    return publicChats;
  } else {
    return null;
  }
};

const getBoards = () => {
  const publicBoardsRaw = document.querySelector('input[name="publicBoards"]')?.value;
  if (publicBoardsRaw) {
    const publicBoards = JSON.parse(publicBoardsRaw);
    return publicBoards;
  } else {
    return null;
  }
};

const getBoard = (boardId) => {
  const boards = getBoards();
  const board = boards.find(board => board.id === boardId);
  if (board) {
    return board;
  } else {
    return null;
  }
};

const getCommentPermission = () => {
  const commentPermissionRaw = document.querySelector('input[name="commentPermission"]')?.value;
  if (commentPermissionRaw) {
    const commentPermission = JSON.parse(commentPermissionRaw);
    return commentPermission;
  } else {
    return null;
  }
};

const getSetting = () => {
  const publicSettingRaw = document.querySelector('input[name="publicSetting"]')?.value;
  if (publicSettingRaw) {
    const publicSetting = JSON.parse(publicSettingRaw);
    return publicSetting;
  } else {
    return null;
  }
};

const getBlockWords = () => {
  const blockWordsRaw = document.querySelector('input[name="blockWords"]')?.value;
  if (blockWordsRaw) {
    const blockWords = JSON.parse(blockWordsRaw);
    const blockWordsArray = blockWords ? blockWords.split(',').map(word => word.trim()).filter(blockWord => blockWord.length) : [];
    return blockWordsArray;
  } else {
    return null;
  }
};

const checkBlockWords = (content) => {
  const blockWords = getBlockWords();
  const result = Object.assign({
    status: true,
    word: null,
  });
  blockWords.forEach(blockWord => {
    if (content.match(blockWord)) {
      result.status = false;
      result.word = blockWord;
    }
  });
  return result;
};

// blockUser
const blockUser = (targetUserId) => {
  return new Promise((resolve, reject) => {
    const data = {
      targetUserId,
    };
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const result = JSON.parse(xhr.responseText);
        if (result) alert(result.message);
        resolve(result);
      } else {
        console.error(xhr.responseText);
      }
    };
    xhr.open('POST', '/api/blockUser');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  });
};

const unblockUser = (targetUserId) => {
  return new Promise((resolve, reject) => {
    const data = {
      targetUserId,
    };
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const result = JSON.parse(xhr.responseText);
        if (result) alert(result.message);
        resolve(result);
      } else {
        console.error(xhr.responseText);
      }
    };
    xhr.open('POST', '/api/blockUser');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  });
};

const adminBlock = (targetUserId) => {
  return new Promise((resolve, reject) => {
    const data = {
      targetUserId,
    };
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const result = JSON.parse(xhr.responseText);
        if (result) alert(result.message);
        resolve(result);
      } else {
        console.error(xhr.responseText);
      }
    };
    xhr.open('POST', '/api/adminBlock');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  });
};

const report = (data) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const result = JSON.parse(xhr.responseText);
        resolve(result);
      } else {
        console.error(xhr.responseText);
      }
    };
    xhr.open('POST', '/api/report');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  });
};

const getCookie = (name) => {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
};

const setCookie = (name, value, options = {}) => {
  options = {
    path: '/',
    ...options,
  };
  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }

  let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

  for (let optionKey in options) {
    updatedCookie += "; " + optionKey;
    let optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += "=" + optionValue;
    }
  }

  document.cookie = updatedCookie;
};

const deleteCookie = (name) => {
  setCookie(name, "", {
    'max-age': -1,
  });
};

const shuffle = (array) => {
  return array.sort(() => Math.random() - 0.5);
};