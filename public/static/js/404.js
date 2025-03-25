import * as utils from '/static/js/common.js'
const response = await fetch('/config')
const config = await response.json()
utils.renderAvatar(config)
utils.renderJSONLD({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": document.querySelector('title').innerText,
  "description": "你所访问的页面不存在",
  "url": location.href
})
await utils.initBackgroundPic()
