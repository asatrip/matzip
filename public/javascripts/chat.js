const socket = io();
// const socket = io('wafflecache.com:8880', {
//   cors: {
//     origin: '*',
//   },
// });

const hash = document.querySelector('meta[name=hash]').content;
const chatContainer = document.querySelector('#chat');
const chatInput = document.querySelector('#msg');
const chatButton = document.querySelector('#send');

(async () => {
  if (chatContainer) {
    const user = getUser();

    const chatList = chatContainer.querySelector('#chatList');
    const chatExpand = chatContainer.querySelector('#chatExpand');
    const chatBox = chatContainer.querySelector('#chatBox');
  
    socket.emit('join', hash, user);
    socket.emit('count', hash);
  
    let day = null;
    
    if (chatExpand) {
      chatExpand.addEventListener('click', () => {
        chatBox.style.height = '300px';
      });
    }
  
    socket.on('join', (data) => {
      
    });
  
    socket.on('leave', (data) => {
      
    });
    
    socket.on('count', (count) => {
      const userCount = document.querySelector('#userCount');
      if (userCount) userCount.textContent = count;
    });
  
    socket.on('notice', (data) => {
      chatList.innerHTML = chatList.innerHTML + `<li class="notice">${data.message}</li>`;
      // 스크롤 최하단 이동
      const body = iframe.contentWindow.document.querySelector('body');
      body.scrollTop = chatList.scrollHeight;
      addChatEvent();
    });
  
    socket.on('block', (data) => {
      if (Number(data.targetUserId) === user.id) {
        chatInput.disabled = true;
        chatInput.placeholder = '차단 되었습니다';
        chatButton.disabled = true;
      }
    });
    
    // 기존 채팅 추가
    const datas = getChats();
    let html = '';
    datas.forEach((data, index) => {
      const datetime = moment(data.createdAt).format('M월 D일');
      if (day !== moment(data.createdAt).format('DD')) {
        html += `<li class="datetime">${datetime}</li>`;
        day = moment(data.createdAt).format('DD');
      }
      html += `<li class="chat" userId="${data.user.id}">`;
      // html += `<span class="time">${data.time}</span>`;
      html += `<span class="nickName">`
      html += `<img src="${data.user.permissionImage}">`;
      html += `${data.user.nickName}</span>`;
      html += `<span class="message">${data.message}</span>`;
      if (user) {
        html += `<ul>`;
        if (user.isAdmin) {
          html += `<li class="block">차단</li>`;
        }
        html += `</ul>`;
      }
      html += `</li>`;
    });
    chatList.innerHTML = chatList.innerHTML + html;
  
  
    // 스크롤 최하단 이동
    chatList.scrollTop = chatList.scrollHeight;
  
    let scrollDownStatus = true;
    const chatEnd = chatContainer.querySelector('#chatEnd');
    const observer = new IntersectionObserver((entires, observer) => {
      entires.forEach((entry) => {
        if (entry.isIntersecting) {
          scrollDownStatus = true;
          newMessagePopup.classList.remove('active');
        } else {
          scrollDownStatus = false;
        }
      });
    });
    
    observer.observe(chatEnd);
  
    const newMessagePopup = chatContainer.querySelector('#newMessage');
    newMessagePopup.addEventListener('click', () => {
      chatList.scrollTop = chatList.scrollHeight;
      newMessagePopup.classList.remove('active');
    });
  
    // 새 채팅 추가
    socket.on('chat', (data) => {
      let html = '';
      const datetime = moment(data.dateTime).format('M월 D일');
      if (day !== moment(data.dateTime).format('DD')) {
        html += `<li class="datetime">${datetime}</li>`;
        day = moment(data.createdAt).format('DD');
      }
      html += `<li class="chat" userId="${data.user.id}">`;
      // html += `<span class="time">${data.time}</span>`;
      html += `<span class="nickName">`;
      html += `<img src="${data.user.permissionImage}">`;
      html += `${data.user.nickName}</span>`;
      html += `<span class="message">${data.message}</span>`;
      html += `</li>`;
      chatList.innerHTML = chatList.innerHTML + html;
      // 스크롤 최하단 이동
      if (scrollDownStatus) {
        chatList.scrollTop = chatList.scrollHeight;
      } else {
        newMessagePopup.classList.add('active');
      }
      addChatEvent();
    });
  
    const addChatEvent = () => {
      const chats = chatList.querySelectorAll('.chat');
      chats.forEach(chat => {
        const targetUserId = chat.getAttribute('userId');
        const nickName = chat.querySelector('.nickName');
        const popUp = chat.querySelector('ul');
        nickName.addEventListener('click', () => {
          if (popUp) {
            popUp.classList.toggle('active');
            const blockBtn = popUp.querySelector('.block');
            blockBtn.addEventListener('click', async () => {
              const result = await adminBlock(targetUserId);
              if (result.status) {
                socket.emit('adminBlock', {
                  targetUserId,
                });
              }
            });
          }
        });
      });
    };
    
    chatButton.addEventListener('click', async () => {
      let message = chatInput.value;
      const tagRegex = new RegExp(/<[^>]*>/g);
      message = message.replace(tagRegex, '');
      message = message.replace(/\n/ig, '<br>');
      if (message !== '') {
        socket.emit('chat', {
          room: hash,
          user,
          message,
        });
        chatInput.value = '';
        chatInput.focus();
      }
    });
  
    addChatEvent();
  }
})();

const moveFocus = (next) => {
  if (window.event.keyCode === 13) {
    chatInput.focus();
    if (next === 'send') {
      chatButton.click();
    }
  }
};