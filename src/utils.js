export function json(data) {
  return new Response(JSON.stringify(data), {headers: {'content-type': 'application/json'}})
}

export function textHtml(data) {
  return new Response(data, {headers: {'content-type': 'text/html'}})
}

export function isTid(str) {
  return /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/.test(str)
}

export function convertStringToTemplate(templateString, context) {
	const regex = /\${(\w+)}/g;

	// Replace placeholders with actual values from the context
	return templateString.replace(regex, (match, key) => {
		return key in context ? context[key] : match;
	});
}
