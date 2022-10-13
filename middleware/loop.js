const delay = require('./delay');

class Loop {
  constructor () {
    this.status = false;
    this.now = 0;
    this.funcList = [];
  }
  create (func, ms) {
    this.funcList.push({
      func,
      ms,
    });
  }
  async start () {
    this.status = true;
    this.now = 0;
    while (this.status === true) {
      this.funcList.forEach(func => {
        if (this.now === 0) {
          func.func();
        }
        if (!func.ms || func.ms === 0 || this.now % func.ms === 0 && this.now !== 0) {
          func.func();
        }
      });
      this.now += 1;
      await delay(0);
    }
  }
  async stop () {
    this.status = false;
  }
}

const loop = new Loop();

module.exports = loop;