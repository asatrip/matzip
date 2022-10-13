const nodemailer = require('nodemailer');
const Class = require('./class');

class Email extends Class {
  async create (targetEmail, data) {
    return new Promise((resolve, reject) => {
      const setting = this.res.locals.setting;
      if (setting.gmailUser && setting.gmailPassword) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: setting.gmailUser,
            pass: setting.gmailPassword,
          },
        });
        data = Object.assign({
          subject: null,
          content: null,
        }, data);
        const {
          subject,
          content,
        } = data;
        const mailOption = {
          from: setting.gmailUser,
          to: targetEmail,
          subject: subject,
          html: content,
        };
        transporter.sendMail(mailOption, (err, info) => {
          if (err) {
            reject('이메일 발송실패');
          } else {{
            resolve(info);
          }}
        });
      } else {
        throw new Error('등록된 이메일이 없습니다');
      }
    });
  }
}

module.exports = Email;