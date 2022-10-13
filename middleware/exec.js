const { exec } = require('node:child_process');
const osutils = require('./osutils');

const CHECK_CPU_USAGE_INTERVAL = 1000 * 10;
const HIGH_CPU_USAGE_LIMIT = 70;

class Execute {
  async restart () {
    exec('pm2 restart all', (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(stdout);
    });
  }
  systemCheck () {
    setInterval(() => {
      osutils.cpuUsage((value) => {
        if (value > HIGH_CPU_USAGE_LIMIT) {
          console.log('restart due to high cpu usage');
          this.restart();
        }
      });
    }, CHECK_CPU_USAGE_INTERVAL);
  }
}

const execute = new Execute();

module.exports = execute;