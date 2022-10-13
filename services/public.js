const cache = require('./cache');

class Public {
  setPublic () {
    
  }
  getUser (user) {
    if (user) {
      // console.log(user);
      return {
        id: user.id,
        email: user.email,
        nickName: user.nickName,
        permission: user.permission,
        permissionImage: user.permissionImage,
        image: user.image,
        point: user.point,
        isLogin: true,
        isManager: user.isManager,
        isAdmin: user.isAdmin,
      };
    } else {
      return {
        isLogin: false,
      }
    }
  }
  getChats (chats) {
    return chats;
  }
  getBoards (boards) {
    return boards;
  }
  getSetting (setting) {
    const publicSetting = {
      theme: setting.theme,
      useMessage: setting.useMessage,
      usePermissionImage: setting.usePermissionImage,
      useManagerArticle: setting.useManagerArticle,
    };
    return publicSetting;
  }
}

const public = new Public();

module.exports = public;