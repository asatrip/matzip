const express = require('express');
const router = express.Router();
const controller = require('../controllers/index');
const { isLogin, isWorkingUser, isAdmin } = require('../middleware/permission');
const doAsync = require('../middleware/doAsync');

// Auth
router.get('/auth/apple', controller.authApple);
router.get('/auth/google', controller.authGoogle);
router.get('/auth/facebook', controller.authFacebook);
router.get('/auth/twitter', controller.authTwitter);
router.get('/auth/naver', controller.authNaver);
router.get('/auth/kakao', controller.authKakao);

// Auth callback
router.post('/auth/apple/callback', controller.authAppleCallback);
router.get('/auth/google/callback', controller.authGoogleCallback);
router.get('/auth/facebook/callback', controller.authFacebookCallback);
router.get('/auth/twitter/callback', controller.authTwitterCallback);
router.get('/auth/naver/callback', controller.authNaverCallback);
router.get('/auth/kakao/callback', controller.authKakaoCallback);

router.get('/join', controller.join);
router.post('/join', controller.join);

router.get('/login', controller.login);
router.post('/login', controller.login);
router.get('/logout', controller.logout);

// Authentication
router.get('/emailAuthentication', controller.emailAuthentication);
router.post('/emailAuthentication', controller.emailAuthentication);
router.get('/smsAuthentication', controller.smsAuthentication);
router.post('/smsAuthentication', controller.smsAuthentication);

router.use('*', doAsync(async (req, res, next) => {
  const user = res.locals.user;
  const setting = res.locals.setting;
  const socialLogin = user?.appleId || user?.googleId || user?.facebookId || user?.twitterId || user?.naverId || user?.kakaoId;
  if (user && setting.useEmailAuthentication && !user.emailAuthentication && !user.isAdmin && !user.workingUser && !socialLogin) {
    res.redirect('/emailAuthentication');
  } else if (user && setting.useSmsAuthentication && !user.phoneAuthentication && !user.isAdmin && !user.workingUser) {
    res.redirect('/smsAuthentication');
  } else {
    next();
  }
}));

router.get('/', controller.index);

router.get('/go/:slug', controller.go);

// 유저 변경
router.get('/changeUser', isWorkingUser, controller.changeUser);
router.post('/changeUser', isWorkingUser, controller.changeUser);

// 출석 체크
router.get('/check', controller.check);
router.post('/check', controller.check);

// 정보 찾기
router.get('/findInfo', controller.findInfo);
router.post('/findInfo', controller.findInfo);
router.get('/findInfo/checkout', controller.findInfoCheckout);
router.post('/findInfo/checkout', controller.findInfoCheckout);

// 랭크
router.get('/rank', controller.rank);

// 포인트
router.get('/point/free', controller.freePoint);

router.get('/terms', controller.terms);
router.get('/privacy', controller.privacy);

router.get('/robots.txt', controller.robots);
router.get('/feed', controller.feed);
router.get('/sitemap.xml', controller.sitemap);
router.get('/sitemap/commons.xml', controller.sitemapCommons);
router.get('/sitemap/board.xml', controller.sitemapBoard);
router.get('/sitemap/article.xml', controller.sitemapArticle);
router.get('/sitemap/page.xml', controller.sitemapPage);
router.get('/sitemap/store.xml', controller.sitemapStore);
router.get('/ads.txt', controller.adsenseAds);

module.exports = router;