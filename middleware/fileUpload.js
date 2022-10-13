const path = require('path');
const AWS = require('aws-sdk');
const config = require('./config');

const s3Info = config.getStorage();

const { accessKeyId, secretAccessKey, region, bucket, host, endpoint } = s3Info;

const spacesEndpoint = new AWS.Endpoint(endpoint);
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
});

const fileUpload = async (file, folder, fileName) => {
  try {
    return new Promise(async (resolve, reject) => {
      let extension = path.extname(file.originalname);
      const str = Math.random().toString(36).substr(2,11);
      let key = null;
      if (fileName) {
        key = fileName;
      } else {
        key = `${Date.now().toString()}-${str}${extension.toLowerCase()}`;
      }
      let data = null;
      if (extension !== '.js') {
        data = file.buffer;

        const originalParams = {
          Bucket: bucket,
          Key: `${folder}/${key}`,
          ACL: 'public-read',
          Body: data,
          ContentType: file.mimetype,
        };
    
        s3.putObject(originalParams, (err, data) => {
          if (err) {
            console.error(err);
            throw new Error('파일 업로드에 실패하였습니다');
          } else {
            resolve(key);
          }
        });
      } else {
        throw new Error('등록 불가능한 타입입니다');
      }
    });
  } catch (e) {
    console.error(e);
  }
};

module.exports = fileUpload;