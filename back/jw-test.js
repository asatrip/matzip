const jwt = require("jsonwebtoken");

const secret = "this is my secret";

const token = jwt.sign(
  { userIdx: 100, nickname: "김철수" }, // payload 정의
  secret // 서버 비밀키
);

// console.log(token);
// console.log(secret);

const verifiedToken = jwt.verify(token, secret);

// console.log(verifiedToken);
