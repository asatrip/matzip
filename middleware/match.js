const match = {
  ip: new RegExp(/[0-9]+.[0-9]+.[0-9]+.[0-9]+/ig),
  tag: new RegExp(/<[^>]*>/ig),
  imgTag: new RegExp(/<img([\w\W]+?)>/ig),
  domain: new RegExp(/(?:[a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣](?:[a-z0-9-ㄱ-ㅎㅏ-ㅣ가-힣]{0,61}[a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/ig),
  email: new RegExp(/(?:[a-z0-9!#$%&'*+/ = ?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/ = ?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/),
  youtube: new RegExp(/<oembed url="http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)[&(amp;)[\w=.]*]?"><\/oembed>/ig),
  vimeo: new RegExp(/<oembed url="https:\/\/vimeo.com\/([0-9]+)"><\/oembed>/ig),
  oembed: new RegExp(/<oembed url=\"(.*?)\"><\/oembed>/ig),
  contentImage: new RegExp(/<figure class="image"><img src="[A-z0-9-.:/]+\/article\/([^"]+)"><\/figure>/ig),
  contentInnerImage: new RegExp(/<img src="[A-z0-9-.:/]+\/article\/([^"]+)">/ig),
  contentReplaceImage: new RegExp(/\[\[image:([A-z0-9-.]+)\]\]/ig),
};

module.exports = match;