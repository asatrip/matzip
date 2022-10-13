class CkEditorFileUploadAdapter {
  _loader;
  _whetherToUpload = false;

  constructor (loader) {
    this._loader = loader;
  }

  upload () {
    return this._loader.file.then(file => new Promise(((resolve, reject) => {
      this._initRequest();
      this._initListeners(resolve, reject, file);
      this._sendRequest(file);
    })));
  }

  _initRequest() {
    const xhr = this.xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/editor/ckeditor5/image/upload', true);
    xhr.responseType = 'json';
  }

  _initListeners(resolve, reject, file) {
    const self = this;
    const xhr = this.xhr;
    const loader = this._loader;
    const genericErrorText = '파일을 업로드 할 수 없습니다.'

    xhr.addEventListener('error', () => { reject(genericErrorText) });
    xhr.addEventListener('abort', () => reject());
    xhr.addEventListener('load', () => {
      self._uploadProcessDone();
      const response = xhr.response;
      if(!response || response.error) {
        return reject(response && response.error ? response.error.message : genericErrorText);
      }

      resolve({ default: response.url });
    });
  }

  _sendRequest (file) {
    const articleId = document.querySelector('input[name=articleId]').value;
    const data = new FormData();
    data.append('image', file);
    data.append('type', 'article');
    data.append('articleId', articleId);
    this.xhr.send(data);
  }

  _uploadProcessDone () {
    this._whetherToUpload = true;
  }

  isUploadCompleted () {
    return this._whetherToUpload;
  }
}