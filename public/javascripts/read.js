const boardId = document.querySelector('#article').getAttribute('boardId');
const articleId = document.querySelector('#article').getAttribute('articleId');
const articleUserId = document.querySelector('#article').getAttribute('userId');

const articleButtons = document.querySelector('.right .buttons');
const articlePopup = document.querySelector('.right .popUp');

if (articleButtons) {
  articleButtons.addEventListener('click', () => {
    articlePopup.classList.toggle('active');
  });
}

const authorNickName = document.querySelector('article .nickName');
const authorPopup = document.querySelector('article > .item .userPopup');
if (authorNickName) {
  authorNickName.addEventListener('click', () => {
    authorPopup.classList.toggle('active');
  });
}

const deletePopup = document.querySelector('article .popUp .deletePopup');
const removeArticle = document.querySelector('#modal .removeArticle');
if (deletePopup) {
  deletePopup.addEventListener('click', () => {
    modal.create(removeArticle);
  });
}

const articleReportBtn = document.querySelector('article .popUp .report');
if (articleReportBtn) {
  articleReportBtn.addEventListener('click', () => {
    reportType.value = 'article';
    reportId.value = articleId;
    modal.create(reportContainer);
  });
}

// share
const shareBtn = document.querySelector('#share');
const sharePopup = document.querySelector('#modal .share');
if (shareBtn) {
  shareBtn.addEventListener('click', () => {
    modal.create(sharePopup);
  });
}

// block
const blockUserBtn = document.querySelector('article .popUp .block');
if (blockUserBtn) {
  blockUserBtn.addEventListener('click', () => {
    blockUser(articleUserId);
  });
}

const unblockUserBtn = document.querySelector('article .popUp .unblock');
if (unblockUserBtn) {
  unblockUserBtn.addEventListener('click', () => {
    unblockUser(articleUserId);
  });
}

const kakaoJavascriptKey = document.querySelector('#modal .share .kakaoTalk')?.id;
if (kakaoJavascriptKey) {
  const title = document.querySelector('input[name=title]').value;
  const description = document.querySelector('input[name=ogContent]').value;
  const imageUrl = document.querySelector('input[name=ogImage]').value;
  const url = document.querySelector('input[name=url]').value;
  Kakao.init(kakaoJavascriptKey);
  const kakaoLink = () => {
    Kakao.Share.createDefaultButton({
      container: '#modal .share .kakaoTalk',
      objectType: 'feed',
      content: {
        title,
        description,
        imageUrl,
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      },
    });
  };
  kakaoLink();
}

const copyToClipboard = (val) => {
  const t = document.createElement('textarea');
  document.body.appendChild(t);
  t.value = val;
  t.select();
  document.execCommand('copy');
  document.body.removeChild(t);
  alert('링크가 클립보드에 복사되었습니다');
  modal.remove(sharePopup);
};

const likeButton = document.querySelector('#like');

if (likeButton) {
  likeButton.addEventListener('click', async () => {
    const result = await getLike(articleId);
    if (result.status) {
      if (likeButton.className === `like`) {
        likeButton.innerHTML = `추천 취소`;
        likeButton.className =`like like-full`;
      } else {
        likeButton.innerHTML = `추천`;
        likeButton.className =`like`;
      }
    } else {
      alert(result.message);
    }
  });
}

const getLike = (articleId) => {
  return new Promise((resolve, reject) => {
    const data = {
      articleId,
    };
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const result = JSON.parse(xhr.responseText);
        resolve(result);
      } else {
        console.error(xhr.responseText);
      }
    };
    xhr.open('POST', '/api/article/like');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  });
}

// Comments
const comments = document.getElementById('comments');

const newComment = document.querySelector('#newComment');
const newCommentBtn = newComment.querySelector('#newComment button');
const newCommentTextarea = newComment.querySelector('#newComment textarea');

const rewriteComments = async (commentList, totalCount) => {
  const user = getUser();
  const board = getBoard(boardId);
  const setting = getSetting();
  let line = '';
  if (commentList.length) {
    commentList.forEach(comment => {
      line += writeComment(comment, user, board, setting);
      comment.replies.forEach(reply => {
        line += writeComment(reply, user, board, setting);
      });
    });
  }
  comments.innerHTML = line;
  addEvent();
};

const writeComment = (comment, user, board, setting) => {
  line = '';
  line += `<div class="comment" aid="${articleId}" uid="${comment.comment_user_ID}" cid="${comment.id}" pid="${comment.comment_parent_ID}" gid="${comment.comment_group_ID}">`;
  if (comment.comment_parent_ID) {
    line += `<div class="isReply"></div>`;
  }
  line += `<div class="userImage" style="background-image: url('${comment.userImage}');">`;
  line += `</div>`;
  line += `<div class="main">`;
  line += `<div class="info">`;
  line += `<div class="left">`;
  if (setting.usePermissionImage) {
    line += `<img src="${comment.permissionImage}" class="permissionImage">`;
  }
  line += `<div class="nickName">`;
  line += `<div class="text">${comment.nickName}</div>`;
  line += `<ul class="userPopup">`;
  line += `<li><a href="/user/${comment.nickName}/articles">게시글 보기</a></li>`;
  line += `<li><a href="/user/${comment.nickName}/comments">댓글 보기</a></li>`;
  line += `<li><a href="/message/send/${comment.nickName}">쪽지 보내기</a></li>`;
  line += `</ul>`;
  line += `</div>`;
  line += `<div class="dot"></div>`;
  if (comment.permissionName) {
    line += `<div class="permissionName">${comment.permissionName}</div>`;
    line += `<div class="dot"></div>`;
  }
  line += `<div class="datetime">${comment.datetime}</div>`;
  if (comment.likeCount) {
    line += `<div class="dot"></div>`;
    line += `<div class="likeCount"><svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="thumbs-up" class="svg-inline--fa fa-thumbs-up fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M466.27 286.69C475.04 271.84 480 256 480 236.85c0-44.015-37.218-85.58-85.82-85.58H357.7c4.92-12.81 8.85-28.13 8.85-46.54C366.55 31.936 328.86 0 271.28 0c-61.607 0-58.093 94.933-71.76 108.6-22.747 22.747-49.615 66.447-68.76 83.4H32c-17.673 0-32 14.327-32 32v240c0 17.673 14.327 32 32 32h64c14.893 0 27.408-10.174 30.978-23.95 44.509 1.001 75.06 39.94 177.802 39.94 7.22 0 15.22.01 22.22.01 77.117 0 111.986-39.423 112.94-95.33 13.319-18.425 20.299-43.122 17.34-66.99 9.854-18.452 13.664-40.343 8.99-62.99zm-61.75 53.83c12.56 21.13 1.26 49.41-13.94 57.57 7.7 48.78-17.608 65.9-53.12 65.9h-37.82c-71.639 0-118.029-37.82-171.64-37.82V240h10.92c28.36 0 67.98-70.89 94.54-97.46 28.36-28.36 18.91-75.63 37.82-94.54 47.27 0 47.27 32.98 47.27 56.73 0 39.17-28.36 56.72-28.36 94.54h103.99c21.11 0 37.73 18.91 37.82 37.82.09 18.9-12.82 37.81-22.27 37.81 13.489 14.555 16.371 45.236-5.21 65.62zM88 432c0 13.255-10.745 24-24 24s-24-10.745-24-24 10.745-24 24-24 24 10.745 24 24z"></path></svg>${comment.likeCount}</div>`;
  }
  if (comment.unlikeCount) {
    line += `<div class="dot"></div>`;
    line += `<div class="unlikeCount"><svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="thumbs-down" class="svg-inline--fa fa-thumbs-down fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M466.27 225.31c4.674-22.647.864-44.538-8.99-62.99 2.958-23.868-4.021-48.565-17.34-66.99C438.986 39.423 404.117 0 327 0c-7 0-15 .01-22.22.01C201.195.01 168.997 40 128 40h-10.845c-5.64-4.975-13.042-8-21.155-8H32C14.327 32 0 46.327 0 64v240c0 17.673 14.327 32 32 32h64c11.842 0 22.175-6.438 27.708-16h7.052c19.146 16.953 46.013 60.653 68.76 83.4 13.667 13.667 10.153 108.6 71.76 108.6 57.58 0 95.27-31.936 95.27-104.73 0-18.41-3.93-33.73-8.85-46.54h36.48c48.602 0 85.82-41.565 85.82-85.58 0-19.15-4.96-34.99-13.73-49.84zM64 296c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24zm330.18 16.73H290.19c0 37.82 28.36 55.37 28.36 94.54 0 23.75 0 56.73-47.27 56.73-18.91-18.91-9.46-66.18-37.82-94.54C206.9 342.89 167.28 272 138.92 272H128V85.83c53.611 0 100.001-37.82 171.64-37.82h37.82c35.512 0 60.82 17.12 53.12 65.9 15.2 8.16 26.5 36.44 13.94 57.57 21.581 20.384 18.699 51.065 5.21 65.62 9.45 0 22.36 18.91 22.27 37.81-.09 18.91-16.71 37.82-37.82 37.82z"></path></svg>${comment.unlikeCount}</div>`;
  }
  line += `</div>`;
  line += `<div class="right">`;
  line += `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="ellipsis-v" class="svg-inline--fa fa-ellipsis-v fa-w-6" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 512"><path fill="#AAAAAA" d="M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z"></path></svg>`;
  line += `<ul id="popUp">`;
  line += `<li class="report"><button type="button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#9DA5B6" d="M476.3 0c-6.365 0-13.01 1.35-19.34 4.233c-45.69 20.86-79.56 27.94-107.8 27.94c-59.96 0-94.81-31.86-163.9-31.87c-34.63 0-77.87 8.003-137.2 32.05V24C48 10.75 37.25 0 24 0S0 10.75 0 24v464C0 501.3 10.75 512 24 512s24-10.75 24-24v-104c53.59-23.86 96.02-31.81 132.8-31.81c73.63 0 124.9 31.78 198.6 31.78c31.91 0 68.02-5.971 111.1-23.09C504.1 355.9 512 344.4 512 332.1V30.73C512 11.1 495.3 0 476.3 0zM464 319.8c-30.31 10.82-58.08 16.1-84.6 16.1c-30.8 0-58.31-7-87.44-14.41c-32.01-8.141-68.29-17.37-111.1-17.37c-42.35 0-85.99 9.09-132.8 27.73V84.14l18.03-7.301c47.39-19.2 86.38-28.54 119.2-28.54c28.24 .0039 49.12 6.711 73.31 14.48c25.38 8.148 54.13 17.39 90.58 17.39c35.43 0 72.24-8.496 114.9-26.61V319.8z"/></svg>신고</button></li>`;
  line += `<li class="block"><button type="button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#9DA5B6" d="M512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM92.93 126.9C64.8 162.3 48 207.2 48 256C48 370.9 141.1 464 256 464C304.8 464 349.7 447.2 385.1 419.1L92.93 126.9zM464 256C464 141.1 370.9 48 256 48C207.2 48 162.3 64.8 126.9 92.93L419.1 385.1C447.2 349.7 464 304.8 464 256z"/></svg>차단</button></li>`;
  line += `</ul>`;
  line += `</div>`;
  line += `</div>`;
  if (comment.comment_parent_ID && comment.comment_parent_ID !== comment.comment_group_ID) {
    line += `<div class="commentContent" id="commentContent">@${comment.parentNickName} ${comment.content}</div>`;
  } else {
    line += `<div class="commentContent" id="commentContent">${comment.content}</div>`;
  }
  line += `<div class="buttons">`;
  line += `<div class="left">`;
  line += `<div class="commentReply"><button id="commentReply">답변</button></div>`;
  line += `</div>`;
  line += `<div class="right">`;
  line += `<div class="likeBtn">`;
  if (comment.userLike) {
    line += `<div class="commentLike"><button id="commentLike">추천 취소</button></div>`;
  } else {
    line += `<div class="commentLike"><button id="commentLike">추천</button></div>`;
  }
  line += `</div>`;
  if (comment.status && (comment.isAuthor || (user?.isManager && setting.useManagerArticle) || user?.isAdmin || !comment.comment_user_ID && board.commentPermission === 0)) {
    line += `<div class="editBtn">`;
    line += `<div class="commentEdit"><button id="commentEdit">수정</button></div>`;
    if (comment.comment_user_ID) {
      line += `<div class="commentDelete"><button id="commentDelete">삭제</button></div>`;
    } else {
      line += `<div class="commentDelete"><button id="commentDeletePopup">삭제</button></div>`;
    }
    line += `</div>`;
  }
  line += `</div>`;
  line += `</div>`;
  line += `<div class="commentEtc" id="commentEtc"></div>`;
  line += `</div>`;
  line += `</div>`;
  line += `</div>`;
  return line;
};

const getComments = (articleId) => {
  const data = {
    articleId,
    boardId,
  };
  const xhr = new XMLHttpRequest();
  xhr.onload = () => {
    if (xhr.status === 200 || xhr.status === 201) {
      const result = JSON.parse(xhr.responseText);
      rewriteComments(result.comments, result.totalCount);
    } else {
      console.error(xhr.responseText);
    }
  };
  xhr.open('POST', '/api/comment/get');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(data));
};

const newCommentApi = (data) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = async () => {
      if (xhr.status === 200 || xhr.status === 201) {
        resolve(true);
      } else {
        console.error(xhr.responseText);
        reject(false);
      }
    };
    xhr.open('POST', '/api/comment/new');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  });
};

if (newCommentBtn) {
  newCommentBtn.addEventListener('click', async () => {
    try {
      const { isLogin, message } = getUser();
      const content = newComment.querySelector('textarea').value;
      const contentResult = blockWordsCheck(content);
      if (contentResult.status) {
        const board = getBoard(boardId);
        if (isLogin || board.commentPermission === 0 && !isLogin) {
          const nickNameInput = newComment.querySelector('input[name="nickName"]');
          const passwordInput = newComment.querySelector('input[name="password"]');
          const nickName = nickNameInput?.value;
          const password = passwordInput?.value;
          if (!content) {
            alert('내용을 입력해주세요');
          } else {
            const data = {
              articleId,
              content,
              nickName,
              password,
            };
            const result = await newCommentApi(data);
            if (result) {
              getComments(articleId);
              newComment.querySelector('textarea').value = '';
              if (nickNameInput) nickNameInput.value = '';
              if (passwordInput) passwordInput.value = '';
            }
          }
        } else {
          alert(message);
        }
      } else {
        alert(`금지어 ${contentResult.word} 사용으로 해당글을 게시할 수 없습니다`);
      }
    } catch (e) {
      console.error(e);
    }
  });
}

const addEvent = async () => {
  try {
    const user = getUser();
    const { isLogin, message } = user;
    const board = getBoard(boardId);
    const userGroupCommentPermission = getUserGroupPermission(boardId, 'commentPermission');

    // 코멘트 각각 기능 삽입
    const comments = document.querySelectorAll('.comment');
    comments.forEach(comment => {
      const commentId = comment.getAttribute('cid');
      const commentUid = comment.getAttribute('uid');
      const commentLikeBtn = comment.querySelector('#commentLike');
      const commentReplyBtn = comment.querySelector('#commentReply');
      const commentEditBtn = comment.querySelector('#commentEdit');
      const commentDeleteBtn = comment.querySelector('#commentDelete');
      const commentDeletePopupBtn = comment.querySelector('#commentDeletePopup');
      const popUpBtn = comment.querySelector('.right');
      const popUpContainer = comment.querySelector('#popUp');
      const reportBtn = popUpContainer.querySelector('.report');
      const blockBtn = popUpContainer.querySelector('.block');
      popUpBtn.addEventListener('click', () => {
        popUpContainer.classList.toggle('active');
      });
      reportBtn.addEventListener('click', () => {
        reportType.value = 'comment';
        reportId.value = commentId;
        modal.create(reportContainer);
      });
      blockBtn.addEventListener('click', () => {
        blockUser(commentUid);
      });

      const commentEtc = comment.querySelector('#commentEtc');

      // 유저 팝업
      const nickName = comment.querySelector('.nickName');
      const nickNamePopUp = comment.querySelector('.userPopup');
      nickName.addEventListener('click', () => {
        nickNamePopUp.classList.toggle('active');
      });

      if (commentLikeBtn) {
        commentLikeBtn.addEventListener('click', () => {
          if (isLogin) {
            const data = {
              commentId,
            };
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/comment/like');
            xhr.onload = () => {
              if (xhr.status === 200 || xhr.status === 201) {
                const result = JSON.parse(xhr.responseText);
                if (result.status) {
                  getComments(articleId);
                } else {
                  alert(result.message);
                }
              } else {
                console.error(xhr.responseText);
              }
            };
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
          } else {
            alert(message);
          }
        });
      }

      if (commentReplyBtn) {
        commentReplyBtn.addEventListener('click', () => {
          if ((isLogin || board.commentPermission === 0) && userGroupCommentPermission) {
            if (commentReplyBtn.textContent === `답변`) {
              commentReplyBtn.textContent = `답변 취소`;
              if (commentEditBtn && commentEditBtn.textContent === `수정 취소`) {
                commentEditBtn.textContent = `수정`;
              }
              commentEtc.innerHTML = '';
              let line = ``;
              line += `<div class="etcCommentContainer">`;
              if (!isLogin && board.commentPermission === 0) {
                line += `<div class="nonMember">`;
                line += `<input type="text" name="nickName" placeholder="닉네임">`;
                line += `<input type="password" name="password" placeholder="비밀번호">`;
                line += `</div>`;
              }
              line += `<div class="contentContainer">`;
              if (isLogin && user.permission >= board.commentPermission || board.commentPermission === 0) {
                line += `<div class="etcCommentContent"><textarea name="reply" id="etcText" placeholder="답변을 작성해주세요"></textarea></div>`;
                line += `<div class="button"><button id="etcComplete">등록</button></div>`;
              } else if (isLogin && user.permission < board.commentPermission) {
                line += `<div class="etcCommentContent"><textarea name="reply" id="etcText" placeholder="권한이 없습니다" disabled></textarea></div>`;
                line += `<div class="button"><button id="etcComplete" disabled>등록</button></div>`;
              } else {
                line += `<div class="etcCommentContent"><textarea name="reply" id="etcText" placeholder="로그인 필요" disabled></textarea></div>`;
                line += `<div class="button"><button id="etcComplete" disabled>등록</button></div>`;
              }
              line += `</div>`;
              line += `</div>`;
              commentEtc.innerHTML = line;
              const etcText = comment.querySelector('#etcText');
              etcText.focus();
              const replyCompleteBtn = comment.querySelector('#etcComplete');
              replyCompleteBtn.addEventListener('click', () => {
                const content = comment.querySelector('#etcText').value;
                const nickName = comment.querySelector('input[name="nickName"]')?.value;
                const password = comment.querySelector('input[name="password"]')?.value;
                const commentParentId = commentId;
                const data = {
                  commentParentId,
                  content,
                  nickName,
                  password,
                };
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/comment/reply');
                xhr.onload = () => {
                  if (xhr.status === 200 || xhr.status === 201) {
                    getComments(articleId);
                  } else {
                    console.error(xhr.responseText);
                  }
                };
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify(data));
              });
            } else {
              commentReplyBtn.textContent = `답변`;
              commentEtc.innerHTML = '';
            }
          } else {
            alert(message || '권한이 없습니다');
          }
        });
      }

      if (commentEditBtn) {
        commentEditBtn.addEventListener('click', () => {
          const nickNameText = comment.querySelector('.nickName .text').textContent;
          const commentContent = comment.querySelector('#commentContent').textContent;
          if (commentEditBtn.textContent === `수정`) {
            commentEditBtn.textContent = `수정 취소`;
            if (commentReplyBtn.textContent === `답변 취소`) commentReplyBtn.textContent = `답변`;
            commentEtc.innerHTML = '';
            let line = ``;
            line += `<div class="etcCommentContainer">`;
            if (!isLogin && board.commentPermission === 0 || !commentUid || commentUid === 'null') {
              line += `<div class="nonMember">`;
              line += `<input type="text" name="nickName" value="${nickNameText}" placeholder="닉네임">`;
              line += `<input type="password" name="password" placeholder="비밀번호">`;
              line += `</div>`;
            }
            line += `<div class="contentContainer">`;
            line += `<div class="etcCommentContent"><textarea name="edit" id="etcText">${commentContent}</textarea></div>`;
            line += `<div class="button"><button id="etcComplete">등록</button></div>`;
            line += `</div>`;
            line += `</div>`;
            commentEtc.innerHTML = line;
            const etcText = comment.querySelector('#etcText');
            let text = etcText.innerHTML;
            if (text.charAt(text.length - 2) != '') {
              text += '';
            }
            etcText.focus();
            etcText.innerHTML = '';
            etcText.innerHTML = text;
            
            const editCompleteBtn = comment.querySelector('#etcComplete');
            editCompleteBtn.addEventListener('click', () => {
              const content = comment.querySelector('#etcText').value;
              const nickName = comment.querySelector('input[name="nickName"]')?.value;
              const password = comment.querySelector('input[name="password"]')?.value;
              const data = {
                commentId,
                content,
                nickName,
                password,
              };
              const xhr = new XMLHttpRequest();
              xhr.open('POST', '/api/comment/edit');
              xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 201) {
                  const result = JSON.parse(xhr.responseText);
                  if (result.status) {
                    getComments(articleId);
                  } else {
                    alert(result.message);
                  }
                } else {
                  console.error(xhr.responseText);
                }
              };
              xhr.setRequestHeader('Content-Type', 'application/json');
              xhr.send(JSON.stringify(data));
            });
          } else {
            commentEditBtn.textContent = `수정`;
            commentEtc.innerHTML = '';
          }
        });
      }

      if (commentDeleteBtn) {
        commentDeleteBtn.addEventListener('click', (e) => {
          if (confirm(`삭제 확인`)) {
            e.stopImmediatePropagation();
            e.preventDefault();
            const data = {
              commentId,
            };
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/comment/delete');
            xhr.onload = () => {
              if (xhr.status === 200 || xhr.status === 201) {
                const result = JSON.parse(xhr.responseText);
                if (result.status) {
                  getComments(articleId);
                } else {
                  alert(result.message);
                }
              } else {
                console.error(xhr.responseText);
              }
            };
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
          }
        });
      }

      if (commentDeletePopupBtn) {
        const removeComment = document.querySelector('#modal .removeComment');
        commentDeletePopupBtn.addEventListener('click', () => {
          modal.create(removeComment);
          const passwordInput = removeComment.querySelector('input');
          const removeCommentCompleteBtn = removeComment.querySelector('button');
          removeCommentCompleteBtn.addEventListener('click', () => {
            modal.remove(removeComment);
            const password = passwordInput.value;
            const data = {
              commentId,
              password,
            };
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/comment/delete');
            xhr.onload = () => {
              if (xhr.status === 200 || xhr.status === 201) {
                const result = JSON.parse(xhr.responseText);
                if (result.status) {
                  getComments(articleId);
                } else {
                  alert(result.message);
                }
              } else {
                console.error(xhr.responseText);
              }
            };
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
          });
        });
      }
    });
  } catch (e) {
    console.error(e);
  }
};

addEvent();