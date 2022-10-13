# Waffleboard

## License
- 와플보드 라이센스는 사이트 1개당 라이센스 입니다.
- 와플보드 소스의 무단 복제, 재배포는 금지되어 있습니다.

## Running
- 서버는 3000번 포트로 기본 실행됩니다.
- 기본 사용 폴더는 cms 폴더 입니다.
- PM2 위에서 서비스를 작동합니다.
### PM2 실행
```
pm2 start 'npm start' --name 'cms' --time
```
### PM2 실행 목록 조회
```
pm2 list
```
### PM2 재실행
```
pm2 restart all
```

## Install
1. `config.json` 파일을 메인 디렉토리에 작성
2. `node install`을 입력하여 설치

## config.json 구조
```json
{
  "language" : "ko",
  "timezone": "Asia/Seoul",
  "sessionSecret": "!@#$%node",
  "s3": {
    "production": {
      "accessKeyId": "API KEY 입력",
      "secretAccessKey": "API SECRET KEY 입력",
      "region": "ap-northeast-2",
      "bucket": "버킷이름",
      "host": "https://버킷이름.s3.ap-northeast-2.amazonaws.com",
      "endpoint": "https://s3.ap-northeast-2.amazonaws.com"
    },
    "development": {
      "accessKeyId": "API KEY 입력",
      "secretAccessKey": "API SECRET KEY 입력",
      "region": "ap-northeast-2",
      "bucket": "버킷이름",
      "host": "https://버킷이름.s3.ap-northeast-2.amazonaws.com",
      "endpoint": "https://s3.ap-northeast-2.amazonaws.com"
    }
  },
  "sql": {
    "production": {
      "host": "데이터베이스 주소",
      "user": "아이디",
      "password": "비밀번호",
      "port": "3306",
      "database": "cms",
      "connectionLimit": 10
    },
    "development": {
      "host": "데이터베이스 주소",
      "user": "아이디",
      "password": "비밀번호",
      "port": "3306",
      "database": "cms",
      "connectionLimit": 10
    }
  }
}
```

## Use
기본적인 MVC 구조를 따릅니다.
- /services - 모델
- /view - 뷰
- /controllers - 컨트롤러
- /routes - 라우터
- /public - 공개 폴더 (이미지, 자바스크립트, 스타일시트 등)
- /middleware - 미들 웨어
- /config - 기타 설정 값

## Routes & Controllers
- index.js - 인덱스 및 기타 페이지 (로그인, 회원가입 등)
- user.js - 사용자
- admin.js - 관리자
- api.js - API
- board.js - 게시판