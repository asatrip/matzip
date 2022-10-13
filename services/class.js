class Class {
  constructor(req, res, conn) {
    this.req = req;
    this.res = res;
    this.conn = conn;
    this.user = res?.locals.user;
    this.setting = res?.locals.setting;
  }
}

module.exports = Class;