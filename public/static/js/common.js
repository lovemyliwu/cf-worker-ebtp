export async function initBackgroundPic () {
    let response = await fetch("//go.smitechow.com/+x/www.bing.com/HPImageArchive.aspx?n=1&format=js&idx=0")
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
