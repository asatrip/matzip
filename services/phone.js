const axios = require('axios').default;
const CryptoJS = require('crypto-js');
const SHA256 = require('crypto-js/sha256');
const Base64 = require('crypto-js/enc-base64');
const Class = require('./class');

class Phone extends Class {
  constructor (req, res, conn) {
    super (req, res, conn);
    this.uri = this.setting.smsServiceId;
    this.accessKey = this.setting.naverCloudPlatformAccessKeyId;
    this.secretKey = this.setting.naverCloudPlatformSecretKey;
  }
  async create (phoneNumber, message) {
    const date = Date.now().toString();

    const method = 'POST';
    const space = ' ';
    const newLine = '\n';
    const url = `https://sens.apigw.ntruss.com/sms/v2/services/${this.uri}/messages`;
    const url2 = `/sms/v2/services/${this.uri}/messages`;

    const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, this.secretKey);

    hmac.update(method);
    hmac.update(space);
    hmac.update(url2);
    hmac.update(newLine);
    hmac.update(date);
    hmac.update(newLine);
    hmac.update(this.accessKey);

    const hash = hmac.finalize();
    const signature = hash.toString(CryptoJS.enc.Base64);

    axios({
      method,
      url,
      headers: {
        'Content-type': 'application/json; charset=utf-8',
        'x-ncp-iam-access-key': this.accessKey,
        'x-ncp-apigw-timestamp': date,
        'x-ncp-apigw-signature-v2': signature,
      },
      data: {
        type: 'SMS',
        countryCode: '82',
        from: this.setting.smsCallerId,
        content: message,
        messages: [
          {
            to: `${phoneNumber}`,
          },
        ],
      },
    }).then(res => {
      const data = res.data;
      console.log(data);
    }).catch(err => {
      console.error(err);
      console.error(err.response.data.errors);
    });
  }
}

module.exports = Phone;