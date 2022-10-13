const arrayAlign = (comments) => {
  let basket = [];
  while (comments.length !== 0) {
    const shift = comments.shift();
    if (!shift.status) {
      shift.content = '삭제된 댓글 입니다.';
    }
    if (!shift.comment_parent_id) {
      basket.push(shift);
      const children = comments.filter(c => c.comment_group_id === shift.id);
      if (children.length) {
        children.forEach(c => {
          if (!c.status) {
            c.content = '삭제된 댓글 입니다.';
          }
          const parent = basket.find(b => b.id === c.comment_parent_id);
          if (parent && parent.status === 1) {
            c.parent_name = parent.user_name || parent.comment_name;
          } else {
            c.parent_name = '삭제된 댓글';
          }
          c.parent = parent;
          const idx = comments.indexOf(c);
          if (idx > -1) comments.splice(idx, 1);
          basket.push(c);
        });
      }
    }
  }
  return basket;
};

module.exports = arrayAlign;