const path = require('path');
const config = require('./config');

const s3Info = config.getStorage();

const {
  host,
} = s3Info;

const engine = (content) =>{
  let lines = null;
  lines = content.split('\r\n');
  for (let i = 0; i < lines.length; i ++) {
    // Regex
    // const link = new RegExp(/\[\[([A-z0-9-ㄱ-ㅎㅏ-ㅣ가-힣\s\.]+)\]\]/ig);
    const link = new RegExp(/\[\[([A-z0-9-ㄱ-ㅎㅏ-ㅣ가-힣\s\:\.\/\-\=\?\&\%]+)\|([A-z0-9-ㄱ-ㅎㅏ-ㅣ가-힣\s\:\.\/\-\=\?\&\%]+)\]\]/);
    const image = new RegExp(/\[\[image:(.*)\]\]/ig);
    const key = new RegExp(/\`([A-z0-9-ㄱ-ㅎㅏ-ㅣ가-힣\.\/\\]+)\`/ig);
    const code = new RegExp(/\`\`\`([A-z0-9-ㄱ-ㅎㅏ-ㅣ가-힣\.\/\\\s]+)\`\`\`/ig);
    const highlight = new RegExp(/\"([A-z0-9-ㄱ-ㅎㅏ-ㅣ가-힣\s\.]+)\"/ig);
    // Image
    if (lines[i].match(image)) {
      const fileName = lines[i].replace(image, '$1');
      const extension = path.extname(fileName);
      lines[i] = `<img src="${host}/article/${fileName}" alt="${fileName.replace(extension, '')}">`;
    }
    // Outlink
    // if (lines[i].match(outlink)) {
    //   lines[i] = lines[i].replace(outlink, '<a href="$2" target="_blank" class="outLink">$1</a>');
    // }
    // Link
    if (lines[i].match(link)) {
      const title = lines[i].match(link)[1];
      const slug = lines[i].match(link)[2];
      if (slug.match('http')) {
        lines[i] = lines[i].replace(link, '<a href="$2" target="_blank" class="outLink">$1</a>');
      } else {
        lines[i] = lines[i].replace(link, '<a href="/$2" class="link">$1</a>');
      }
    }
    // Code
    if (lines[i].match(code)) {
      lines[i] = lines[i].replace(code, '<span class="code">$1</span>');
    }
    // Key
    if (lines[i].match(key)) {
      lines[i] = lines[i].replace(key, '<span class="key">$1</span>');
    }
    // H Tag
    if (lines[i].match(/^#/g)) {
      if (lines[i].match(/^# /g)) {
        lines[i] = lines[i].replace(/^# (.*)/gm, `<h2>$1</h2>`);
      } else if (lines[i].match(/^## /g)) {
        lines[i] = lines[i].replace(/^## (.*)/gm, `<h3>$1</h3>`)
      } else if (lines[i].match(/^### /g)) {
        lines[i] = lines[i].replace(/^### (.*)/gm, `<h4>$1</h4>`)
      } else if (lines[i].match(/^#### /g)) {
        lines[i] = lines[i].replace(/^#### (.*)/gm, `<h5>$1</h5>`)
      } else if (lines[i].match(/^##### /g)) {
        lines[i] = lines[i].replace(/^##### (.*)/gm, `<h6>$1</h6>`)
      }
    } else {
      lines[i] = lines[i].replace(/(.*)/, '$1<br>');
    }
  }
  content = lines.join('\n');
  return content;
};

module.exports = engine;