export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

        // gate service
        if (url.host === env.GATE_HOST) {
            console.log(456)
            switch (url.pathname) {
                case '/go':
                    return await go(env, url.searchParams.get('u'))
                default:
				    return new Response('Not Found', { status: 404 });
            }
        }

        // blog service
        if (url.pathname.startsWith('/static')) return env.ASSETS.fetch(request)
        switch (url.pathname) {
            case '/config':
                return await getConfig(env)
            case '/data':
                return await getData(env, url)
            case '/searchBlogs':
                // mock to test
                const r = await fetch(new Request(`https://${env.API_HOST}/xrpc/app.bsky.feed.searchPosts${url.search}`))
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
        const res = await handleBlogHTMLRequest(request, env, url)
        const rewriter = new HTMLRewriter().on('html', new HTMLTagRewriter(env)).on('title', new TitleRewriter(env, request.url)).on('footer', new FooterRewriter(env))
        return rewriter.transform(res)
    }
};

class FooterRewriter {
    constructor(env) {
        this.env = env
    }

    element(element) {
        element.setInnerContent(this.env.WEB_PAGE_FOOTER)
    }
}

class HTMLTagRewriter {
    constructor(env) {
        this.env = env
    }

    element(element) {
        element.setAttribute('lang', this.env.WEB_PAGE_CONTENT_LANGUAGE)
    }
}

class TitleRewriter {
    constructor(env, url) {
        this.env = env
        this.url = new URL(url)
    }

    element(element) {
        if (this.url.pathname === '/') {
            element.setInnerContent(this.env.WEB_APP_TITLE)
        } else if (isTid(this.url.pathname.slice(1)) || this.url.pathname === '/search') {
            element.setInnerContent(this.env.WEB_PAGE_TITLE)
        } else if (this.url.pathname === '/about') {
            element.setInnerContent(`关于 - ${this.env.WEB_APP_TITLE}`)
        } else {
            element.setInnerContent(`页面未找到 - ${this.env.WEB_APP_TITLE}`)
        }
    }
}

function handleBlogHTMLRequest(request, env, url) {
    if (isTid(url.pathname.slice(1))) {
        url.pathname = '/article.html'
        return env.ASSETS.fetch(new Request(url.toString()))
    }

    switch (url.pathname) {
        case '/':
        case '/search':
            url.pathname = '/search.html'
            return env.ASSETS.fetch(new Request(url.toString()))
        case '/about':
            return env.ASSETS.fetch(request)
        default:
            url.pathname = '/404.html'
            return env.ASSETS.fetch(new Request(url.toString()));
    }
}

async function go(env, postAt) {
	let [,, rkey] = postAt.slice('at://'.length).split('/')
	let uri = `https://${env.BLOG_HOST}/${rkey}`
	return new Response(`<html><head><meta http-equiv="refresh" content="0; URL='${uri}'" /><style>:root { color-scheme: light dark; }</style></head></html>`, {
		headers: {
			'content-type': 'text/html'
		}
	})
}

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
	const meta = record?.embed?.external?.meta
	return json({record, blog})
}

async function getConfig(env) {
    const response = await fetch(`https://${env.API_HOST}/xrpc/app.bsky.actor.getProfile?actor=${env.DID}`)
    const data = await response.json()
    return json({
        ...data,
        'gate_host': env.GATE_HOST,
        'blog_host': env.BLOG_HOST,
        'api_host': env.API_HOST,
        'app_host': env.APP_HOST,
        'search_page_size': env.SEARCH_PAGE_SIZE,
        'web_app_title': env.WEB_APP_TITLE
    })
}

function json(data) {
    return new Response(JSON.stringify(data), {headers: {'content-type': 'application/json'}})
}

function isTid(str) {
    return /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/.test(str)
}