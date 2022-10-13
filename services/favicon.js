const path = require('path');
const sharp = require('sharp');
const sizeOf = require('image-size');
const AWS = require('aws-sdk');
const Class = require('./class');
const imageUpload = require('../middleware/imageUpload');
const config = require('../middleware/config');
const s3Info = config.getStorage();
const cache = require('./cache');

const {
  accessKeyId,
  secretAccessKey,
  region,
  bucket,
  host,
  endpoint,
} = s3Info;

const spacesEndpoint = new AWS.Endpoint(endpoint);
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

class Favicon extends Class {
  async create (image) {
    const imageSize = await sizeOf(image.buffer);
    if (imageSize.width >= 600 && imageSize.height >= 600 && imageSize.width === imageSize.height) {
      const key = await imageUpload({
        image,
        folder: `assets`,
      });
      const extension = path.extname(key);
      const fileName = key.replace(extension, '');
      this.faviconUpload(image, 512, `${fileName}-512x512${extension}`);
      this.faviconUpload(image, 300, `${fileName}-300x300${extension}`);
      // this.faviconUpload(image, 192, `${fileName}-192x192${extension}`);
      this.faviconUpload(image, 180, `${fileName}-180x180${extension}`);
      // faviconUpload(image, 144, `${fileName}-144x144${extension}`);
      this.faviconUpload(image, 96, `${fileName}-96x96${extension}`);
      // this.faviconUpload(image, 72, `${fileName}-72x72${extension}`);
      // this.faviconUpload(image, 48, `${fileName}-48x48${extension}`);
      this.faviconUpload(image, 32, `${fileName}-32x32${extension}`);
      this.faviconUpload(image, 16, `${fileName}-16x16${extension}`);
      return key;
    } else {
      throw new Error('파비콘 이미지는 정사각형 600px 이상이어야 합니다');
    }
  }
  async remove (key) {
    const extension = path.extname(key);
    const fileName = key.replace(extension, '');
    // Original
    s3.deleteObject({
      Bucket: bucket,
      Key: `assets/${key}`,
    }, (err, data) => {
      if (err) console.error(err);
    });
    // 512
    s3.deleteObject({
      Bucket: bucket,
      Key: `assets/${fileName}-512x512${extension}`,
    }, (err, data) => {
      if (err) console.error(err);
    });
    // 300
    s3.deleteObject({
      Bucket: bucket,
      Key: `assets/${fileName}-300x300${extension}`,
    }, (err, data) => {
      if (err) console.error(err);
    });
    // 180
    s3.deleteObject({
      Bucket: bucket,
      Key: `assets/${fileName}-180x180${extension}`,
    }, (err, data) => {
      if (err) console.error(err);
    });
    // 96
    s3.deleteObject({
      Bucket: bucket,
      Key: `assets/${fileName}-96x96${extension}`,
    }, (err, data) => {
      if (err) console.error(err);
    });
    // 32
    s3.deleteObject({
      Bucket: bucket,
      Key: `assets/${fileName}-32x32${extension}`,
    }, (err, data) => {
      if (err) console.error(err);
    });
    // 16
    s3.deleteObject({
      Bucket: bucket,
      Key: `assets/${fileName}-16x16${extension}`,
    }, (err, data) => {
      if (err) console.error(err);
    });
  }
  async faviconUpload (image, size, fileName) {
    imageUpload({
      image,
      folder: `assets`,
      fileName,
      size,
    });
  };
}

module.exports = Favicon;