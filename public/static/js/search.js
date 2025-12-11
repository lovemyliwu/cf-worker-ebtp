import * as utils from '/static/js/common.js'
const response = await fetch('/config')
const config = await response.json()
let url = new URL(location.href)

function search(url) {
    if (url.searchParams.get('q')) {
        renderKeywordSearch(url)
    } else if (url.searchParams.get('tag')) {
        renderTagSearch(url)
    } else {
        location.href = '/'
    }
}

function getSearchUrl(q) {
    return `/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=100&sort=latest&domain=${config.gate_host}`
}

async function renderTagSearch(url) {
    utils.renderTitle(`Tag:${url.searchParams.get('tag')}`)
    const q = `#${url.searchParams.get('tag')} from:${config.handle}`
    const search_url = getSearchUrl(q)
    await renderSearch(search_url)
}

async function renderKeywordSearch(url) {
    // utils.renderTitle(`Keyword:${url.searchParams.get('q')}`)
    // const q = `${url.searchParams.get('q')} from:${config.handle}`
    // const search_url = getSearchUrl(q)
    // await renderSearch(search_url)
    const q = `site:blog.smitechow.com ${url.searchParams.get('q')}`
    location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`
}

async function renderSearch(search_url) {
    // const response = await fetch(search_url)
    // const data = await response.json()
    const data = {posts: []}
    renderBlogpostingPage(null, data, document.querySelector('title').innerText, "符合搜索条件的文章列表")
}

async function renderIndexPage(url) {
    const api = new URL(`${config.api_origin}/xrpc/app.bsky.feed.getFeed`)
    api.searchParams.set('feed', 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot')
    api.searchParams.set('limit', url.searchParams.get('limit') ?? config.search_page_size)
    api.searchParams.set('xfeed', config.index_feed)
    if (url.searchParams.get('cursor'))
      api.searchParams.set('cursor', url.searchParams.get('cursor'))

    const response = await fetch(api)
    const data = await response.json()
    renderBlogpostingPage(
      data.cursor,
      { posts: data.feed.map(item => item.post) },
      config.web_app_title,
      config.web_app_description
    )
}

function renderBlogpostingPage(apiCursor, data, name, description) {
    renderBlogPosts(data.posts, 0, apiCursor)
    utils.renderAvatar(config)
    utils.renderJSONLD({
        "@context": "https://schema.org",
        "@type": "Blog",
        "url": location.origin,
        "name": name,
        "description": description,
        "publisher": {
            "@type": "Organization",
            "contactPoint": {
              "@type": "ContactPoint",
              "email": config.web_app_contact_email
            },
            "description": config.web_app_description,
            "email": config.web_app_contact_email,
            "logo": `${location.origin}/static/img/avatar.jpg`,
            "name": config.web_app_title,
            "url": location.origin,
        },
        "blogPost": data.posts.map(post => {
            const rkey = post.uri.split('/').pop()
            const external = post.record.embed.external
            const {
                title,
                description
            } = external
            const date = post.record.createdAt
            const author = post.author.displayName
            let image = `${location.origin}/static/img/avatar.jpg`
            if (external?.thumb?.ref?.$link) image = `${location.origin}/img/feed_thumbnail/plain/${config.did}/${external.thumb.ref.$link}`
            return {
                "@type": "BlogPosting",
                "url": `${location.origin}/${rkey}`,
                "headline": title,
                "image": image,
                "datePublished": date,
                "dateModified": date,
                "author": [{
                    "@type": "Person",
                    "name": author,
                    "url": `${location.origin}/about`
                }]
            }
        })
    })
}

function renderBlogPosts(allPosts, cursor, apiCursor) {
    if (!allPosts.length) {
        document.querySelector('#postsContainer').innerHTML = '<div class="rich_media_area_primary">没有找到任何文章，<a href="/">回到主页</a></div>'
        document.querySelector('.navigator').style.display = 'none'
        return
    }

    const posts = allPosts.slice(cursor, cursor + config.search_page_size)
    let articleList = []
    for (let post of posts) {
        const external = post.record.embed.external
        let {
            title,
            description
        } = external
        const date = post.record.createdAt
        let tags = post.record.facets.map(item => item.features[0]).filter(item => item.$type === 'app.bsky.richtext.facet#tag').map(item => item.tag)
        tags = tags.map(utils.renderTagSegment).join('')
        const rkey = post.uri.split('/').pop()
        const author = post.author.displayName
        const ele = utils.convertStringToTemplate(articleTemplate, {
            title,
            date,
            author,
            description,
            tags,
            rkey
        })
        articleList.push(ele)
    }
    document.querySelector('#postsContainer').innerHTML = articleList.join('')

    if ((allPosts.length - 1) > (cursor + config.search_page_size)) {
        document.querySelector('#nextCursor').onclick = event => {
            renderBlogPosts(allPosts, cursor + config.search_page_size);
        }
        document.querySelector('#nextCursor').style.display = 'inline'
    }
    else if (apiCursor) {
      document.querySelector('#nextCursor').onclick = event => {
          const url = new URL(location.href)
          url.searchParams.set('cursor', apiCursor)
          location.href = url
      }
      document.querySelector('#nextCursor').style.display = 'inline'
    }
    else {
        document.querySelector('#nextCursor').style.display = 'none'
    }

    if (cursor > 0) {
        document.querySelector('#preCursor').onclick = event => {
            renderBlogPosts(allPosts, Math.max(cursor - config.search_page_size, 0));
        }
        document.querySelector('#preCursor').style.display = 'inline'
    } else {
        document.querySelector('#preCursor').style.display = 'none'
    }
}

const articleTemplate = `
<div class="rich_media_area_primary">
<h2 class="rich_media_title">
\${title}
</h2>
<div class="rich_media_meta_list">
<em class="rich_media_meta rich_media_meta_text">
\${date}
</em>
<em class="rich_media_meta rich_media_meta_link rich_media_meta_nickname">
\${author}
</em>
</div>
<div class="markdown-body">
\${description}
</div>
<div class="rich_media_tool">
<div class="media_tool_meta tips_global meta_primary" style="">标签：</div>
\${tags}
<a class="media_tool_meta tips_global meta_extra" href="/\${rkey}" title="\${title}">
阅读全文 »
</a>
</div>
</div>
`

switch (url.pathname) {
    case '/':
        renderIndexPage(url)
        break
    case '/search':
        search(url)
        break
    default:
        location.href = '/'
}
await utils.initBackgroundPic();
