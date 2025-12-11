import { handleRequest as gateService } from './gate.js'
import { json } from './utils.js'
import { HTMLTagRewriter, TitleRewriter, FooterRewriter, AppTitleRewriter } from './rewriter.js'
import { handleRequest as pageService } from './page.js'

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url)
    if (url.host === env.GATE_HOST) {
      return gateService(request, env, ctx)
    }

    // blog service
    if (url.pathname.startsWith('/static/')) return env.ASSETS.fetch(request)

    switch (url.pathname) {
      case '/config':
        return await getConfig(env)
      case '/data':
        return await getData(env, url)
    }
    const res = await pageService(request, env, ctx)
    const rewriter = new HTMLRewriter()
      .on('html', new HTMLTagRewriter(env))
      .on('title', new TitleRewriter(env, request.url))
      .on('footer', new FooterRewriter(env))
      .on('.app-title', new AppTitleRewriter(env))
    return rewriter.transform(res)
  }
};


async function getData(env, url) {
  const rkey = url.searchParams.get('rkey')
  if (!rkey) return json({ error: 'BadParams', message: `bad params`})

  const response = await fetch(`https://${env.PDS_HOST}/xrpc/com.atproto.repo.getRecord?repo=${env.DID}&collection=app.bsky.feed.post&rkey=${rkey}`)
  const result = await response.json()
  if (result.error) return json(result)

	const record = result.value
	const blog_blob = record?.embed?.external?.blog
	if (!blog_blob) return json({ error: 'NotEBTP', message: 'not found embed blog in the post'})

	const blogResponse = await fetch(`https://${env.PDS_HOST}/xrpc/com.atproto.sync.getBlob?did=${env.DID}&cid=${blog_blob.ref.$link}`)
  const blog = await blogResponse.text()
	return json({record, blog})
}

async function getConfig(env) {
  const response = await fetch(`https://${env.API_HOST}/xrpc/app.bsky.actor.getProfile?actor=${env.DID}`)
  const data = await response.json()
  return json({
    ...data,
    'gate_host': env.GATE_HOST,
    'app_host': env.APP_HOST,
    'search_page_size': env.SEARCH_PAGE_SIZE,
    'web_app_title': env.WEB_APP_TITLE,
    'web_app_description': env.WEB_APP_DESCRIPTION,
    'web_app_contact_email': env.WEB_APP_CONTACT_EMAIL,
    'index_feed': env.INDEX_FEED,
    'api_origin': `https://${env.API_HOST}`
  })
}
