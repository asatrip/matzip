const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin');
const multer = require('multer');

router.get('/', controller.index);

router.get('/log', controller.log);

router.get('/user', controller.user);
router.post('/user/new', controller.userNew);
router.post('/user/edit/:userId', controller.userEdit);
router.get('/user/detail/:userId', controller.userDetail);
router.post('/user/detail/:userId', controller.userDetail);

router.get('/menu', controller.menu);
router.post('/menu/new', controller.menuNew);
router.post('/menu/edit/:menuId', controller.menuEdit);

router.get('/board', controller.board);
router.post('/board/new', controller.boardNew);
router.post('/board/edit/:boardId', controller.boardEdit);
router.get('/board/detail/:boardId', controller.boardDetail);
router.post('/board/detail/:boardId', multer().fields([{ name: 'image' }]), controller.boardDetail);
router.post('/board/detail/:boardId/customHtml', controller.boardCustomHtml);
router.post('/board/detail/:boardId/permission/:permissionId', controller.boardDetailPermission);
router.post('/board/detail/:boardId/userGroup/:userGroupId', controller.boardDetailUserGroup);

router.post('/category/new', controller.categoryNew);
router.post('/category/edit/:categoryId', multer().fields([{ name: 'image' }]), controller.categoryEdit);

router.get('/article', controller.article);
router.post('/article/edit/:articleId', controller.articleEdit);

router.get('/comment', controller.comment);
router.post('/comment/edit/:commentId', controller.commentEdit);

router.get('/chat', controller.chat);
router.post('/chat/edit/:chatId', controller.chatEdit);
router.post('/chat/deleteAll', controller.chatDeleteAll);

router.get('/point', controller.point);
router.post('/point/download', controller.pointDownload);

router.get('/message', controller.message);
router.post('/message/edit/:messageId', controller.messageEdit);

router.get('/report', controller.report);
router.post('/report/edit/:reportId', controller.reportEdit);

router.get('/userGroup', controller.userGroup);
router.post('/userGroup/new', controller.userGroupNew);
router.post('/userGroup/edit/:userGroupId', controller.userGroupEdit);

router.get('/pointWithdraw', controller.pointWithdraw);
router.post('/pointWithdraw/:pointWithdrawId', controller.pointWithdraw);

router.get('/page', controller.page);
router.get('/page/new', controller.pageNew);
router.post('/page/new', controller.pageNew);
router.get('/page/edit/:pageId', controller.pageEdit);
router.post('/page/edit/:pageId', controller.pageEdit);
router.post('/page/edit/:pageId/update', controller.pageUpdate);

router.get('/banner', controller.banner);
router.post('/banner', controller.banner);
router.get('/banner/:position', controller.bannerDetail);
router.post('/banner/new', multer().fields([{ name: 'image' }]), controller.bannerNew);
router.post('/banner/edit/:bannerId', multer().fields([{ name: 'image' }]), controller.bannerEdit);

router.get('/totalMessage', controller.totalMessage);
router.post('/totalMessage/sendMessage', controller.sendMessage);
router.post('/totalMessage/sendEmail', controller.sendEmail);

router.get('/sectionGroup', controller.sectionGroup);
router.post('/sectionGroup/new', controller.sectionGroupNew);
router.post('/sectionGroup/edit/:sectionGroupId', controller.sectionGroupEdit);
router.get('/sectionGroup/detail/:sectionGroupId', controller.sectionGroupDetail);
router.post('/section/new', controller.sectionNew);
router.post('/section/edit/:sectionId', controller.sectionEdit);

router.get('/permission', controller.permission);
router.post('/permission', controller.permission);
router.post('/permission/new', controller.permissionNew);
router.post('/permission/edit/:permissionId', multer().fields([{ name: 'image' }]), controller.permissionEdit);

router.get('/asset', controller.asset);
router.post('/asset/new', multer().fields([{ name: 'images' }]), controller.assetNew);
router.post('/asset/edit/:assetId', controller.assetEdit);

router.get('/go', controller.go);
router.post('/go/new', controller.goNew);
router.post('/go/edit/:goId', controller.goEdit);

router.get('/check', controller.check);
router.post('/check', controller.check);
router.post('/check/new', controller.checkNew);
router.post('/check/edit/:checkContinueId', controller.checkEdit);

router.get('/setting', controller.setting);
router.post('/setting/basic', controller.settingBasic);
router.post('/setting/domain', controller.settingDomain);
router.post('/setting/email', controller.settingEmail);
router.post('/setting/template', controller.settingTemplate);
router.post(
  '/setting/design',
  multer().fields([
    { name: 'logoImage' },
    { name: 'logoImageDarkMode' },
    { name: 'faviconImage' },
    { name: 'ogImage' },
  ]),
  controller.settingDesign,
);
router.post('/setting/etcdesign', controller.settingEtcDesign);
router.post('/setting/customDesign', controller.settingCustomDesign);
router.post('/setting/indexHeadTag', controller.settingIndexHeadTag);
router.post('/setting/banner', controller.settingBanner);
router.post('/setting/board', controller.settingBoard);
router.post('/setting/customTags', controller.settingCustomTags);
router.post('/setting/termsAndPrivacy', controller.settingTermsAndPrivacy);
router.post('/setting/adsense', controller.settingAdsense);
router.post('/setting/blockWords', controller.settingBlockWords);
router.post('/setting/joinForm', controller.settingJoinForm);
router.post('/setting/social', controller.settingSocial);
router.post('/setting/sms', controller.settingSms);
router.post('/setting/api', controller.settingApi);
router.post('/setting/etc', controller.settingEtc);

router.get('/hidden', controller.hidden);
router.post('/hidden', controller.hidden);

router.get('/parsing', controller.parsing);
router.post('/parsing', controller.parsing);
router.get('/parsing/start', controller.parsingStart);
router.get('/parsing/stop', controller.parsingStop);
router.post('/parsing/site/new', controller.parsingSiteNew);
router.post('/parsing/site/edit/:siteId', controller.parsingSiteEdit);
router.get('/parsing/site/detail/:siteId', controller.parsingSiteDetail);
router.post('/parsing/board/new', controller.parsingBoardNew);
router.post('/parsing/board/edit/:boardId', controller.parsingBoardEdit);

module.exports = router;