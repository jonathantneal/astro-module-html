let JS = require('./lib/JS.js')
let FS = require('fs/promises')
let HTML = require('./lib/HTML.js')

module.exports = (snowpackConfig, pluginOptions) => ({
	name: 'snowpack-module-html',
	resolve: {
		input: ['.module.html'],
		output: ['.js', '.module.html'],
	},
	async load(id) {
		let html = await FS.readFile(id.filePath, 'utf8')
		let classURI = getClassURI(id, snowpackConfig)
		let js = toElementConstructor(html, classURI)
		let output = { '.js': js }

		return output
	},
})

/** Returns the URI for the current module. */
let getClassURI = (id, snowpackConfig) => {
	for (let dir in snowpackConfig.mount) {
		if (id.filePath.startsWith(dir)) {
			return snowpackConfig.mount[dir].url + id.filePath.slice(dir.length) + '.js'
		}
	}
	return null
}

/** Returns an HTMLElement object from a string of HTML. */
let toElementNode = (
	/** @type {string} */
	html
) => {
	/** @type {HTMLElement} */
	let element = null
	for (let node of HTML.parse(html)) {
		if (node?.tagName === 'ELEMENT') {
			element = node
		}
	}
	return element
}


// MethodDefinition { key: Identifier, value: FunctionExpression { params: [], body: BlockStatement } }
let createMethod = (decl) => {
	fake = JS.find(JS.parse(`class $ { ${decl.id.name}() {} }`), 'MethodDefinition')
	fake.value.params = decl.params
	fake.value.body = decl.body
	return JS.stringify(fake)
}

let toHtmlData = (html) => {
	/** @type {HTMLElement} */
	let element = toElementNode(html) || { attributes: {}, childNodes: [], innerHTML: '' }
	let props = {}
	let proto = ''
	let childHTML = ''
	for (let childNode of element.childNodes) {
		if (childNode.tagName === 'SCRIPT') {
			let ast = JS.parse(childNode.innerHTML)
			JS.find(ast, 'ExportNamedDeclaration', (node) => {
				if (node.declaration.type === 'FunctionDeclaration') {
					proto += createMethod(node.declaration)
				}
			})
		} else {
			childHTML += childNode.outerHTML || childNode.data
		}
	}
	childHTML = childHTML.trim()
	for (let attr of element.attributes) {
		props[attr.name] = attr.value
	}
	return { childHTML, props, proto }
}

/** Returns an array of 0 or more oberved attributes. */
let toObservedAttributes = (
	/** @type {string} */
	attributes
) => {
	let attributesString = String(typeof attributes === 'string' ? attributes : '').trim()
	let observedAttributes = attributesString ? [ ...new Set(attributesString.split(/\s+/)) ] : null

	return observedAttributes
}

/** Returns a string of JavaScript constructing an element from the given HTML. */
let toElementConstructor = (
	/** @type {string} */
	html,
	/** @type {string} */
	classURI
) => {
	let metadata = toHtmlData(html)

	let observedAttributes = toObservedAttributes(metadata.props.attributes)

	// classURI
	let strClassURI = `var classURI=${JSON.stringify(classURI)}`

	// observedAttributes
	let strObservedAttributes = observedAttributes ? `var observedAttributes=${JSON.stringify(observedAttributes)}\n` : ``

	// jsElementClass
	let strElementClass = `export class Element extends HTMLElement{${
		`constructor(){` +
			`super().attachShadow(${
				`{` +
					`mode:${JSON.stringify(metadata.props.shadowroot || 'open')}` +
				`}`
			}).innerHTML=${
				JSON.stringify(metadata.childHTML)
			}` +
		`}` + metadata.proto
	}}${
		observedAttributes ? `\nElement.observedAttributes=observedAttributes` : ``
	}`

	let strDefaultExport = `export default {classURI${observedAttributes ? `,observedAttributes` : ``}}`

	let js = `${strClassURI}\n${strObservedAttributes}${strElementClass}\n${strDefaultExport}`

	return js
}
