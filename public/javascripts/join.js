const emailCheck = (email) => {
  return new Promise((resolve, reject) => {
    const data = {
      email,
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
    xhr.open('POST', '/api/emailCheck');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  });
};

const allCheck = document.querySelector('#all');
const termsCheck = document.querySelector('#terms');
const privacyCheck = document.querySelector('#privacy');
allCheck.addEventListener('click', () => {
  if (allCheck.checked) {
    termsCheck.checked = true;
    privacyCheck.checked = true;
  } else {
    termsCheck.checked = false;
    privacyCheck.checked = false;
  }
});

const onSubmit = async (form) => {
  if (!form.email.value || !form.password.value || !form.passwordCheck.value) {
    alert('입력란을 모두 입력해주세요');
    return false;
  }

  if (form.password.value !== form.passwordCheck.value) {
    alert('입력된 비밀번호가 서로 다릅니다');
    return false;
  }

  if (!form.password.value.length > 6) {
    alert('비밀번호는 6자리 이상 입력해주세요');
    return false;
  }

  if (!form.terms.checked || !form.privacy.checked) {
    alert('이용약관 및 개인정보수집 정책에 동의해야 합니다');
    return false;
  }

  const emailResult = await emailCheck(form.email.value);
  if (emailResult.status) {
    form.submit();
  } else {
    alert(emailResult.message);
  }
};