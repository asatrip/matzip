
const config = require('./config');

const sql = config.getDatabase();
const { host, user, password, port, database, connectionLimit, waitForConnections, queueLimit } = sql;

function connection() {
  try {
    const mysql = require('mysql2');

    const pool = mysql.createPool({
      host,
      user,
      password,
      port,
      database,
      timezone: 'utc',
      connectionLimit: connectionLimit || 10,
      waitForConnections: waitForConnections || true,
      queueLimit: queueLimit || 0,
    });

    const promisePool = pool.promise();

    return promisePool;
  } catch (error) {
    return console.error(`Could not create database connection - ${error}`);
  }
}

const pool = connection();

module.exports = {
  connection: async () => pool.getConnection(),
  execute: (...params) => pool.execute(...params)
};