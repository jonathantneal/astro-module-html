import './server-shim.js'

export default {
	check(component) {
		return typeof component.classURI === 'string'
	},
	renderToStaticMarkup(component, props, childHTML, metadata) {
		let tagName = toHyphenName(metadata.displayName)

		let importJS = `import(${
			JSON.stringify(component.classURI
		)}).then(${
			`(imported)=>customElements.get("${tagName}")||customElements.define("${tagName}",imported.Element)`
		})`
		let importHTML = `<script type="module">${importJS}</script>`

		let { attrs, slots } = toAttrsAndSlots(props, component.observedAttributes)

		let hasScript = String(Object.keys(props)) === 'client:script'
		let hasScriptOnly = hasScript && !childHTML

		let html = (
			hasScriptOnly
				? importHTML
			: `<${tagName}${attrs}>${slots}${childHTML}${
				hasScript ? importHTML : ``
			}</${tagName}>`
		)

		let output = { html }

		return output
	},
}

let toAttrsAndSlots = (props, observedAttributes) => {
	observedAttributes = new Set(observedAttributes || [])

	let attrs = ''
	let slots = ''

	for (let name in props) {
		if (name === 'client:script') continue

		if (observedAttributes.has(name)) {
			attrs += ` ${name}="${props[name]}"`
		} else {
			slots += `<data slot="${name}">${props[name]}</data> `
		}
	}

	return { attrs, slots }
}

let toHyphenName = (name) => name.replace(/[A-Z]/g, '-$&').toLowerCase().replace(/^-/, 'html-')
