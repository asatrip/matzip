const { timezone } = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault(timezone);

class Cache {
  constructor () {
    this.sqlStatus = true;
    this.articles = [];
    this.menus = null;
    this.boards = null;
    this.userGroups = null;
    this.banners = null;
    this.permissions = null;
    this.sectionGroups = null;
    this.assets = null;
    this.plugins = null;
    this.setting = null;
    this.pages = null;
    this.gos = null;
    this.count = null;
    this.chats = null;
    this.favicon = null;
    // Location
    this.location = null;
    this.cities = null;
    this.provinces = null;
    this.customs = [];
    this.views = [];
    this.custom = {
      headers: [],
      footers: [],
      indexs: [],
    }
  }
  setArticle (article) {
    const result = this.articles.find(loadedArticle => loadedArticle.id === article.id);
    if (result) {
      
    } else {
      article.timeout = moment(new Date()).add(60, 'm');
      this.articles.push(article);
    }
  }
  getArticle (articleInfo) {
    articleInfo = Object.assign({
      id: null,
      slug: null,
    }, articleInfo);
    const {
      id,
      slug,
    } = articleInfo;
    let article = null;
    if (id) {
      article = this.articles.find(article => article.id === id);
    } else if (slug) {
      article = this.articles.find(article => article.slug === slug);
    }
    return article;
  }
  updateArticle (article) {

  }
  checkArticles () {
    const check = () => {
      this.articles = this.articles.filter(article => article.timeout > moment(new Date()));
      // console.log(this.articles.length);
    };
    setInterval(check, 1000 * 5);
  }
}

const cache = new Cache();

module.exports = cache;