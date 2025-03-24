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
        if (isTid(url.pathname)) {
            url.pathname = 'article.html'
            return env.ASSETS.fetch(new Request(url.toString()))
        }

        switch (url.pathname) {
            case '/config':
                return getConfig(env)
            case '/':
            case '/search':
                url.pathname = '/search.html'
                return env.ASSETS.fetch(new Request(url.toString()))
            case '/about':
                return env.ASSETS.fetch(request)
            default:
                url.pathname = '404'
                return env.ASSETS.fetch(new Request(url.toString()));
        }
	},
};

async function go(env, postAt) {
	let [,, rkey] = postAt.slice('at://'.length).split('/')
	let uri = `https://${env.BLOG_HOST}/${rkey}`
	return new Response(`<html><head><meta http-equiv="refresh" content="0; URL='${uri}'" /><style>:root { color-scheme: light dark; }</style></head></html>`, {
		headers: {
			'content-type': 'text/html'
		}
	})
}

function getConfig(env) {
    return json({
        'handle': env.HANDLE,
        'gate_host': env.GATE_HOST,
        'list_page_size': env.LIST_PAGE_SIZE
    })
}

function json(data) {
    return new Response(JSON.stringify(data), {headers: {'content-type': 'application/json'}})
}

function isTid(str) {
    return /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/.test(str)
}