export async function initBackgroundPic () {
    let response = await fetch("https://go.smitechow.com/+x/www.bing.com/HPImageArchive.aspx?n=1&format=js&idx=0")
    response = await response.json()
    document.querySelector('body').style.backgroundImage='url(//www.bing.com' + response.images[0].url + ')'
}

export function convertStringToTemplate(templateString, context) {
	const regex = /\${(\w+)}/g;

	// Replace placeholders with actual values from the context
	return templateString.replace(regex, (match, key) => {
		return key in context ? context[key] : match;
	});
}

export function renderTitle(title) {
	document.querySelector('title').innerText = convertStringToTemplate(document.querySelector('title').innerText, {title})
}

export function renderTagSegment(tag) {
  return `<a class="meta_original_tag" href="/search?tag=${encodeURIComponent(tag)}">${tag}</a>`
}

export function renderAvatar(config) {
  document.querySelector('#actoravatar').style.background = `url(${config.avatar}) no-repeat`
  document.querySelector('#actoravatar').style.backgroundSize = 'cover'
  document.querySelector('#actorDisplayName').innerText = config.displayName
}

export function renderJSONLD(data) {
    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }
