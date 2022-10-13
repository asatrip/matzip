const align = (images) => {
  images.sort((a, b) => a.originalname.toLowerCase() < b.originalname.toLowerCase() ? -1 : 1);
  return images;
};

module.exports = align;