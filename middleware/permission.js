const flash = require('./flash');
const doAsync = require('./doAsync');

exports.isLogin = doAsync(async (req, res, next) => {
  const user = req.session.user;
  if (user) {
    next();
  } else {
    flash.create({
      status: false,
      message: '로그인이 필요합니다',
    });
    res.redirect('/login');
  }
});

exports.isWorkingUser = doAsync(async (req, res, next) => {
  const user = req.session.user;
  if (user?.workingUser || user.isManager || user.isAdmin) {
    next();
  } else {
    flash.create({
      status: false,
      message: '로그인이 필요합니다',
    });
    res.redirect('/login');
  }
});

exports.isManager = doAsync(async (req, res, next) => {
  const user = req.session.user;
  if (user?.isManager) {
    next();
  } else {
    flash.create({
      status: false,
      message: '관리자 권한이 필요합니다',
    });
    res.redirect('/login');
  }
});

exports.isAdmin = doAsync(async (req, res, next) => {
  const user = req.session.user;
  if (user?.isAdmin) {
    next();
  } else {
    flash.create({
      status: false,
      message: '관리자 권한이 필요합니다',
    });
    res.redirect('/login');
  }
});