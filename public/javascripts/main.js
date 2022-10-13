// Confirm delete buttons
const deleteBtn = document.querySelectorAll('button[value="delete"]');
deleteBtn.forEach(b => {
  b.addEventListener('click', (e) => {
    if (!confirm('삭제 확인')) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });
});

// Modal
const modalContainer = document.querySelector('article #modal');
const modalBackground = document.querySelector('article #modal .background');
const modalContainers = document.querySelectorAll('article #modal .container');
const modal = {
  create (selector) {
    modalContainer.classList.add('active');
    selector.classList.add('active');
  },
  remove (selector) {
    modalContainer.classList.remove('active');
    selector.classList.remove('active');
  }
}
if (modalBackground) {
  modalBackground.addEventListener('click', () => {
    modalContainer.classList.remove('active');
    modalContainers.forEach(modalContainer => {
      modalContainer.classList.remove('active');
    });
  });
}

const reportContainer = document.querySelector('#modal .report');
const reportType = document.querySelector('#modal .report input[name="type"]');
const reportId = document.querySelector('#modal .report input[name="id"]');
const reportContent = document.querySelector('#modal .report textarea');
const reportCompleteBtn = document.querySelector('#modal .report button');
if (reportCompleteBtn) {
  reportCompleteBtn.addEventListener('click', async () => {
    const data = {
      reportType: reportType.value,
      reportId: reportId.value,
      content: reportContent.value,
    };
    const result = await report(data);
    if (result) {
      modal.remove(reportContainer);
      reportContent.value = '';
      alert(result.message);
    }
  });
}

// Theme
const toggleThemeBtn = document.querySelector('#toggleTheme');
const theme = localStorage.getItem('theme');
const setting = getSetting();

if (!theme && setting.theme === 'auto') {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    setCookie('theme', 'dark');
    toggleThemeBtn.textContent = '라이트모드 전환';
  } else {
    document.body.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    setCookie('theme', 'light');
    toggleThemeBtn.textContent = '다크모드 전환';
  }
} else if (!theme && setting.theme === 'light') {
  document.body.removeAttribute('data-theme');
  setCookie('theme', 'dark');
  toggleThemeBtn.textContent = '다크모드 전환';
} else if (!theme && setting.theme === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
  setCookie('theme', 'light');
  toggleThemeBtn.textContent = '라이트모드 전환';
}

if (toggleThemeBtn) {
  if (theme == 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    setCookie('theme', 'dark');
    toggleThemeBtn.textContent = '라이트모드 전환';
  }
  
  toggleThemeBtn.addEventListener('click', () => {
    let theme = localStorage.getItem('theme');
    if (theme == 'dark') {
      document.documentElement.removeAttribute('data-theme');
      document.body.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      setCookie('theme', 'light');
      toggleThemeBtn.textContent = '다크모드 전환';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      setCookie('theme', 'dark');
      toggleThemeBtn.textContent = '라이트모드 전환';
    }
  });
}

// Adsense
window.addEventListener('load', () => {
  const matches = document.querySelectorAll('ins.ADSENSE');
  Array.from(matches).forEach((element) => {
    const parentElement = element.parentElement;
    if (window.getComputedStyle(parentElement).getPropertyValue('display') === 'none')  { 
        element.remove(); 
    } else {
    element.classList.remove('ADSENSE');
    element.classList.add('adsbygoogle');
      (adsbygoogle = window.adsbygoogle || []).push({}); 
    }
  });
});