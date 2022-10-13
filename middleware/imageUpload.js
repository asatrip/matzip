const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const sizeOf = require('image-size');
const AWS = require('aws-sdk');
const config = require('./config');

const s3Info = config.getStorage();

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

const imageUpload = async (data) => {
  data = Object.assign({
    image: null,
    folder: null,
    fileName: null,
    size: 1280,
    quality: 80,
  }, data);
  const {
    image,
    folder,
    fileName,
    size,
    quality,
  } = data;
  let extension = path.extname(image.originalname);
  const extensionFilter = [
    '.jpeg',
    '.jpg',
    '.png',
    '.gif',
    '.svg',
    '.mp4',
    '.webp',
    '.heic',
  ];
  const filterResult = extensionFilter.find(filter => filter === extension.toLowerCase());
  if (filterResult) {
    if (extension === '.jpeg') extension = '.jpg';
    const str = Math.random().toString(36).substr(2,11);
    let key = null;
    if (fileName) {
      key = fileName;
    } else {
      key = `${Date.now().toString()}-${str}${extension.toLowerCase()}`;
    }
    let imageRaw = null;
    if (extension !== '.mp4') {
      const originalSize = sizeOf(image.buffer);
      if (extension !== '.gif' && extension !== '.svg') {
        if (size) {
          if (originalSize.width > size) {
            imageRaw = await sharp(image.buffer)
              .resize({
                width: size,
              })
              .withMetadata()
              .toBuffer();
          } else {
            imageRaw = await sharp(image.buffer)
              .withMetadata()
              .toBuffer();
          }
        } else {
          if (originalSize.width > 1280) {
            imageRaw = await sharp(image.buffer)
              .resize({
                width: 1280,
              })
              .withMetadata()
              .toBuffer();
          } else {
            imageRaw = await sharp(image.buffer)
              .withMetadata()
              .toBuffer();
          }
        }
      } else {
        imageRaw = image.buffer;
      }
    } else {
      imageRaw = image.buffer;
    }

    if (config.storageType === 's3') {
      await s3.putObject({
        Bucket: bucket,
        Key: `${folder}/${key}`,
        ACL: 'public-read',
        Body: imageRaw,
        ContentType: image.mimetype,
      }, (err, data) => {
        if (err) console.error(err);
      }).promise();
    } else if (config.storageType === 'local') {
      const folderExist = fs.existsSync(path.join(__dirname, `../public/storage/${folder}`));
      if (!folderExist) fs.mkdirSync(path.join(__dirname, `../public/storage/${folder}`), {
        recursive: true,
      });
      fs.writeFileSync(path.join(__dirname, `../public/storage/${folder}/${key}`), imageRaw);
    } else {
      await s3.putObject({
        Bucket: bucket,
        Key: `${folder}/${key}`,
        Body: imageRaw,
        ContentType: image.mimetype,
      }, (err, data) => {
        if (err) console.error(err);
      }).promise();
    }

    return key;
  } else {
    console.log(`${extension}는 허용된 파일 타입이 아닙니다`);
    return null;
  }
};

module.exports = imageUpload;