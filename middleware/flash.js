const flash = {
  watched: false,
  basket: {
    status: null,
    message: null,
  },
  init (app) {
    app.use((req, res, next) => {
      if (!this.watched) {
        res.locals.flash = this.basket;
      }
      this.watched = true;
      next();
    });
  },
  create (args) {
    this.watched = false;
    this.basket = args;
  }
}

module.exports = flash;