import { json } from "./utils.js"

async function fakeSearch(url) {
  const r = await fetch(new Request(url.toString()))
  const d = await r.json()
  let posts = []

  if (!d.posts.length) return json({posts})

  let post = d.posts[0]
  for (let idx = 0; idx < 32 ; idx ++) {
    posts.push({...post, no: idx})
  }
  return json({posts})
}

export async function handleRequest(request, env, ctx) {
  const url = new URL(request.url)
  const needFake = url.host.startsWith('localhost') && url.pathname === '/xrpc/app.bsky.feed.searchPosts'

  if (url.pathname.startsWith('/xrpc/'))
    url.host = env.API_HOST
  else
    url.host = env.CDN_HOST
  url.protocol = 'https:'
  url.port = ''

  if (needFake) {
    return await fakeSearch(url)
  }

  return fetch(new Request(url.toString()))
}
