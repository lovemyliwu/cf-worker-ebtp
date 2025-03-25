import { json } from "./utils.js"

export async function handleRequest(request, env, ctx) {
  // mock to test
  const url = new URL(request.url)
  url.host = env.API_HOST
  url.protocol = 'https:'
  url.port = ''
  console.log(`request bsky api: ${url.toString()}`)

  if (url.pathname !== '/xrpc/app.bsky.feed.searchPosts') {
    return fetch(new Request(url.toString()))
  }
  const r = await fetch(new Request(url.toString()))
  const d = await r.json()
  console.log(d)
  let posts = []

  if (!d.posts.length) return json({posts})

  let post = d.posts[0]
  for (let idx = 0; idx < 32 ; idx ++) {
    posts.push({...post, no: idx})
  }
  return json({posts})
}
