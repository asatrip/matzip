const _uploadAdapters = [];

const onSubmit = (form) => {
  if (form.nickName && !form.nickName.value) {
    alert('닉네임을 입력해주세요');
    return false;
  }

  if (form.password && !form.password.value) {
    alert('비밀번호를 입력해주세요');
    return false;
  }

  if (!form.title.value) {
    alert('제목을 입력해주세요');
    return false;
  }

  const content = document.querySelector('.ck-content');
  if (content.innerHTML === '<p><br data-cke-filler="true"></p>') {
    alert('내용을 입력해주세요');
    return false;
  }

  if (_uploadAdapters.length > 0 && _uploadAdapters.some(e => e.isUploadCompleted() === false)) {
    alert('파일 업로드가 완료되지 않았습니다.');
    return false;
  }

  const titleResult = checkBlockWords(form.title.value);
  const contentResult = checkBlockWords(content.innerHTML);
  if (titleResult.status) {
    if (contentResult.status) {
      form.submit();
    } else {
      alert(`금지어 ${contentResult.word} 사용으로 해당글을 게시할 수 없습니다`);
    }
  } else {
    alert(`금지어 ${titleResult.word} 사용으로 해당글을 게시할 수 없습니다`);
  }
}

function MyCustomUploadAdapterPlugin (editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    const adapter = new CkEditorFileUploadAdapter(loader);
    _uploadAdapters.push(adapter);
    return adapter;
  };
};
const imageUploadConfig = {
  types: [ 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg+xml', ],
};
ClassicEditor
  .create(document.querySelector('#editor'), {
    image: {
      upload: imageUploadConfig,
    },
    toolbar: [ 'heading', '|', 'ImageUpload', 'mediaEmbed', 'link', '|', 'bold', 'italic', 'fontColor', 'fontBackgroundColor', 'alignment', 'bulletedList', 'numberedList', '|', 'blockQuote', 'insertTable', 'undo', 'redo', '|', 'sourceEditing' ],
    extraPlugins: [MyCustomUploadAdapterPlugin],
    mediaEmbed: {
      previewsInData: true,
    },
  })
  .then(editor => {
    editor.editing.view.change(writer => {
      writer.setStyle('min-height', '100px', editor.editing.view.document.getRoot());
    });
  })
  .catch(error => {
    console.error(error);
  });