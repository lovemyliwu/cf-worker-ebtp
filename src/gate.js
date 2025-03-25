import { textHtml } from './utils.js'

export async function handleRequest(request, env, ctx) {
  const url = new URL(request.url)
  switch (url.pathname) {
    case '/go':
      return go(env, url.searchParams.get('u'))
    default:
	    return new Response('Not Found', { status: 404 });
  }
}

function go(env, postAt) {
	const [,, rkey] = postAt.slice('at://'.length).split('/')
	const uri = `${env.BLOG_ORIGIN}/${rkey}`
	return textHtml(`<html><head><meta http-equiv="refresh" content="0; URL='${uri}'" /><style>:root { color-scheme: light dark; }</style></head></html>`)
}
