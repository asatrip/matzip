const { pool } = require("../../config/database");

//회원목록
exports.readUsers = async function (connection) {
  const Query = `SELECT * FROM Users;`;
  const Params = [];

  const rows = await connection.query(Query, Params);

  return rows;
};

// 로그인 (회원검증)
exports.isValidUsers = async function (connection, userID, password) {
  const Query = `SELECT userIdx, nickname FROM Users where userID = ? and password = ? and status = 'A';`;
  const Params = [userID, password];

  const rows = await connection.query(Query, Params);

  return rows;
};

// 회원가입
exports.insertUsers = async function (connection, userID, password, nickname) {
  const Query = `insert into Users (userID, password, nickname) values (?,?,?);`;

  const Params = [userID, password, nickname];

  const rows = await connection.query(Query, Params);

  return rows;
};

//------------------------------------------------------------------

exports.deleteStudent = async function (connection, studentIdx) {
  const Query = `update Students set status = "D" where studentIdx = ?;`;
  const Params = [studentIdx];

  const rows = await connection.query(Query, Params);

  return rows;
};

exports.updateStudents = async function (
  connection,
  studentIdx,
  studentName,
  major,
  birth,
  address
) {
  const Query = `update Students set studentName = ifnull(?, studentName), major = ifnull(?, major), birth = ifnull(?, birth), address = ifnull(?, address) where studentIdx = ?;`;
  const Params = [studentName, major, birth, address, studentIdx];

  const rows = await connection.query(Query, Params);

  return rows;
};

exports.isValidStudentIdx = async function (connection, studentIdx) {
  const Query = `SELECT * FROM Students where studentIdx = ? and status = 'A';`;
  const Params = [studentIdx];

  const [rows] = await connection.query(Query, Params);

  if (rows < 1) {
    return false;
  }

  return true;
};

exports.insertStudents = async function (
  studentName,
  connection,
  major,
  birth,
  address
) {
  const Query = `insert into Students (studentName, major, birth, address) values (?,?,?,?);`;
  const Params = [studentName, major, birth, address];

  const rows = await connection.query(Query, Params);

  return rows;
};

exports.selectStudents = async function (connection, studentIdx) {
  const Query = `SELECT * FROM Students where studentIdx = ?;`;
  const Params = [studentIdx];

  // const selectStudentByNameQuery = `SELECT * FROM Students where studentName = ?;`;
  // let Query = studentName ? selectStudentByNameQuery : selectAllStudentsQuery;

  // if (!studentName) {
  //   Query = selectAllStudentsQuery;
  // } else {
  //   Query = selectStudentByNameQuery;
  // }

  const rows = await connection.query(Query, Params);
  return rows;
};

exports.exampleDao = async function (connection) {
  const Query = `SELECT * FROM Restaurants;`;
  const Params = [];

  const rows = await connection.query(Query, Params);

  return rows;
};
