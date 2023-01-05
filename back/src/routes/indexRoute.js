module.exports = function (app) {
  const index = require("../controllers/indexController");
  const jwtMiddleware = require("../../config/jwtMiddleware");

  // 라우터 정의
  // app.HTTP메서드(uri, 컨트롤러 콜백함수)
  // app.get("/dummy", index.example);
  app.get("/students/:studentIdx", index.readStudents);
  app.get("/students/", index.example);
  app.get("/restaurants/", index.example);

  // 학생 생성
  app.post("/students", index.createStudent);
  //학생 업데이트
  app.patch("/students/:studentIdx", index.updateStudent);
  //학생 삭제
  app.delete("/students/:studentIdx", index.deleteStudent);

  //회원목록조회
  app.get("/users/", index.readUsers);
  //회원가입
  app.post("/sign-up", index.createUsers);
  //로그인
  app.post("/sign-in", index.createJwt);
  //로그인유지, 토큰 검증
  app.get("/jwt", jwtMiddleware, index.readJwt);
};
