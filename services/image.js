const Class = require('./class');
const config = require('../middleware/config');
const imageUpload = require('../middleware/imageUpload');

/* AWS S3 */
const AWS = require('aws-sdk');
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

class Image extends Class {
  async getImages (articleId) {
    const [images, ] = await this.conn.query(`SELECT * FROM image WHERE image_article_ID = ? ORDER BY id ASC`, [articleId]);
    return images;
  }
  async get (imageId) {
    const [images, ] = await this.conn.query(`SELECT * FROM image WHERE id = ?`, [imageId]);
    if (images.length) {
      const image = images[0];
      return image;
    } else {
      return false;
    }
  }
  async create (data) {
    data = Object.assign({
      articleId: null,
      commentId: null,
      pageId: null,
      image: null,
    }, data);
    const { articleId, commentId, pageId, image } = data;
    let type = null;
    if (articleId) {
      type = 'article';
    } else if (commentId) {
      type = 'comment';
    } else if (pageId) {
      type = 'page';
    }
    const key = await imageUpload(image, type);
    if (articleId) await imageUpload(image, 'thumb', key, 640);
    await this.conn.query(`INSERT INTO image (image_article_ID, image_comment_ID, image_page_ID, \`key\`) VALUES (?, ?, ?, ?)`, [articleId, commentId, pageId, key]);
  }
  async remove (imageId) {
    await this.conn.query(`DELETE FROM image WHERE \`key\` = ?`, [imageId]);
    const params = {
      Bucket: bucket,
      Key: `article/${imageId}`,
    };
    s3.deleteObject(params, (err, data) => {
      if (err) {
        console.error(err);
      }
    });
    // Delete Thumb
    const thumbParams = {
      Bucket: bucket,
      Key: `thumb/${imageId}`,
    };
    s3.deleteObject(thumbParams, (err, data) => {
      if (err) {
        console.error(err);
      }
    });
  }
  align (images) {
    images.sort((a, b) => a.originalname.toLowerCase() < b.originalname.toLowerCase() ? -1 : 1);
    return images;
  }
}

module.exports = Image;