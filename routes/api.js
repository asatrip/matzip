const express = require('express');
const router = express.Router();
const controller = require('../controllers/api');
const multer = require('multer');

// CKEditor5
router.post('/editor/ckeditor5/image/upload', multer().fields([{ name: 'image' }]), controller.imageUpload);

// Engine
router.post('/image/new', multer().fields([{ name: 'images' }]), controller.imageNew);
router.post('/image/delete', controller.imageDelete);

router.post('/user/image', multer().fields([{ name: 'image' }]), controller.userImage);

// Chat
router.post('/blockChat', controller.blockChat);

// User
router.post('/blockUser', controller.blockUser);
router.post('/unblockUser', controller.unblockUser);

router.post('/adminBlock', controller.adminBlock);

router.post('/emailCheck', controller.emailCheck);
router.post('/nickNameCheck', controller.nickNameCheck);

router.post('/phoneVerify', controller.phoneVerify);
router.post('/phoneVerify/complete', controller.phoneVerifyComplete);

router.post('/report', controller.report);

router.post('/article/like', controller.articleLike);

router.post('/comment/get', controller.getComments);
router.post('/comment/new', controller.newComment);
router.post('/comment/reply', controller.replyComment);
router.post('/comment/edit', controller.editComment);
router.post('/comment/delete', controller.deleteComment);
router.post('/comment/like', controller.likeComment);
router.post('/comment/unlike', controller.unlikeComment);

// Parsing
router.post('/article/create', controller.articleCreate);

module.exports = router;