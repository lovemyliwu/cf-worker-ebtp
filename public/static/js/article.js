import * as utils from '/static/js/common.js'
import '/static/js/bsky_comments.js'
const response = await fetch('/config')
const config = await response.json()
let url = new URL(location.href)

const template = `
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
\${content}
</div>
<div class="rich_media_tool">
<div class="media_tool_meta tips_global meta_primary">标签：</div>
\${tags}
</div>
</div>`

function generateTLDR([root, related, pre], item) {
   let preTag = pre?.tagName;
   let tag = item.tagName;
   let container;
   if (pre === null) {
       container = root;
   } else if (preTag !== tag) {
       if (preTag < tag) {
           let subContainer = document.createElement('ol');
           related.append(subContainer);
           container = subContainer;
       } else {
           container = related.parentElement.parentElement.parentElement;
       }
   } else {
       container = related.parentElement;
   }
   let listItem = document.createElement('li');
   listItem.innerHTML = `<a href="#${item.id}">${item.innerText}</a>`;
   container.append(listItem);
   return [root, listItem, item];
}

function initTLDR() {
   let markdownBody = document.querySelector('.markdown-body');
   let [content, _, __] = [...markdownBody.children].filter(item => /H[1-6]{1}/.test(item.tagName)).reduce(generateTLDR, [document.createElement('ol'), null, null]);
   if (content.childElementCount) {
       let tldr = document.createElement('div');
       let label = document.createElement('h2');
       label.innerText = 'TL;DR';
       tldr.append(label);
       tldr.append(content);
       document.querySelector('.rich_media_area_primary').insertBefore(tldr, markdownBody)
   }
}

async function renderArticle(url) {
    const rkey = url.pathname.slice(1)
    const response = await fetch(`/data?rkey=${rkey}`)
    const data = await response.json()
    const external = data.record.embed.external
    const meta = external.meta

    if (data.error) throw Error(data.message)

    utils.renderTitle(meta.title)
    const tags = [...meta.categories, ...meta.tags]
    document.querySelector('#postsContainer').innerHTML = utils.convertStringToTemplate(template, {
        ...meta,
        tags: tags.map(utils.renderTagSegment).join(''),
        content: data.blog
    })
    const postAt = `at://${config.did}/app.bsky.feed.post/${rkey}`
    let ele = document.createElement('bluesky-comments')
    ele.setAttribute('url', postAt)
    ele.setAttribute('api_origin', location.origin)
    ele.setAttribute('app_host', config.app_host)
    ele.setAttribute('labelers', 'did:plc:ar7c4by46qjdydhdevvrndac;redact, did:web:cgv.hukoubook.com')
    document.querySelector('#comments').appendChild(ele)

    utils.renderAvatar(config)
    let image = `${location.origin}/static/img/avatar.jpg`
    if (external?.thumb?.ref?.$link) image = `${location.origin}/img/feed_thumbnail/plain/${config.did}/${external.thumb.ref.$link}`
    utils.renderJSONLD({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": meta.title,
        "image": image,
        "datePublished": meta.date,
        "dateModified": meta.date,
        "description": meta.excerpt,
        "author": [{
            "@type": "Person",
            "name": meta.author,
            "url": `${location.origin}/about`
        }]
    })
    initTLDR();
}

renderArticle(url)
await utils.initBackgroundPic();
