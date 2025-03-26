import { isTid, textHtml, convertStringToTemplate } from './utils.js'

export async function handleRequest(request, env, ctx) {
  const url = new URL(request.url)
  const response = await env.ASSETS.fetch(new Request(`${url.origin}/app.html`))
  const html = await response.text()
  if (isTid(url.pathname.slice(1))) {
    return articlePage(html)
  }

  switch (url.pathname) {
    case '/':
    case '/search':
      return searchPage(html)
    case '/about':
      return aboutPage(html)
    default:
      return notFoundPage(html)
  }
}

function articlePage(html) {
  const main = `
<div id="postsContainer">loading...</div>
<div class='rich_media_tool navigator'>
<div class='media_tool_meta tips_global meta_primary'>导航：</div>
<a id="goHome" href="/">←返回主页</a>
<a id="goComment" href="#">加入讨论→</a>
<a class='tips_global meta_extra' href='#'>↑回到页顶</a>
</div>
<div id="comments"></div>`
  const moduleJs = `<script type="module" src="/static/js/article.js"></script>`
  return textHtml(convertStringToTemplate(html, {main, moduleJs}))
}

function searchPage(html) {
  const main = `
<div id="postsContainer">loading...</div>
<div class='rich_media_tool navigator'>
<div class='media_tool_meta tips_global meta_primary'>导航：</div>
<a id="nextCursor" href="#">←较旧的博文</a>
<a id="preCursor" href="#">较新的博文→</a>
<a class='tips_global meta_extra' href='#'>↑回到页顶</a>
</div>`
  const moduleJs = `<script type="module" src="/static/js/search.js"></script>`
  return textHtml(convertStringToTemplate(html, {main, moduleJs}))
}

function aboutPage(html) {
  const main = `
<div id="postsContainer">
<div class="rich_media_area_primary">
<h2 class="rich_media_title">
关于
</h2>
<div class="markdown-body">
Bluesky账号：@smitechow.com
</div>
</div>
</div>
<div class='rich_media_tool navigator'>
<div class='media_tool_meta tips_global meta_primary'>导航：</div>
<a id="goHome" href="/">←返回主页</a>
<a class='tips_global meta_extra' href='#'>↑回到页顶</a>
</div>`
  const moduleJs = `<script type="module" src="/static/js/about.js"></script>`
  return textHtml(convertStringToTemplate(html, { main, moduleJs }))
}

function notFoundPage(html) {
  const main = `
<div id="postsContainer">
<div class="rich_media_area_primary">
你所访问的页面不存在，请返回<a href="/">主页</a>
</div>
</div>`
  const moduleJs = `<script type="module" src="/static/js/404.js"></script>`
  return textHtml(convertStringToTemplate(html, { main, moduleJs }), 404)
}
