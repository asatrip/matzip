const colors = require('colors');
const mysql = require('mysql2/promise');
const config = require('./config');

const sql = config.getDatabase();

const {
  host,
  user,
  password,
  port,
  database,
  connectionLimit,
  waitForConnections,
  queueLimit,
} = sql;

const pool = mysql.createPool({
  host,
  user,
  password,
  port,
  database,
  connectionLimit: connectionLimit || 10,
  waitForConnections: waitForConnections || true,
  queueLimit: queueLimit || 0,
  charset: 'utf8mb4',
});

pool.on('acquire', function (connection) {
  console.log('Connection %d acquired'.blue, connection.threadId);
});

pool.on('connection', function (connection) {
  connection.query('SET SESSION auto_increment_increment = 1')
});

pool.on('enqueue', function () {
  console.log('Waiting for available connection slot'.red);
});

pool.on('release', function (connection) {
  console.log('Connection %d released'.blue, connection.threadId);
});

pool.on('error', (err) => {
  console.error('Database Error');
  console.error(err);
});

module.exports = pool;