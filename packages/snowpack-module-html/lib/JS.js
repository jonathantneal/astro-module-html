let { generate } = require('astring')
let { importAssertions } = require('acorn-import-assertions')
let { Parser } = require('acorn')
let acornClassFields = require('acorn-class-fields')
let acornJsx = require('acorn-jsx')
let acornLogicalAssignment = require('acorn-logical-assignment')
let acornPrivateMethods = require('acorn-private-methods')
// let transformJsx = require('mxn-jsx-ast-transformer')

let acornPlugins = [
	acornJsx({ allowNamespaces: true, allowNamespacedObjects: true }),
	acornClassFields,
	acornLogicalAssignment,
	acornPrivateMethods,
	importAssertions
]

let parser = Parser.extend(...acornPlugins)

let parse = (code) => {
	let parsed = parser.parse(code, { sourceType: 'module', ecmaVersion: 'latest' })

	return parsed
}

let stringify = (ast) => generate(ast)

let find = (node, type, next) => {
	if (node.type === type) {
		if (next) next(node)
		else return node
	}
	for (let name in node) {
		if (name === 'type') continue
		let data = node[name]
		if (Array.isArray(data)) {
			for (data of data) {
				let deep = find(data, type, next)
				if (deep && !next) return deep
			}
		} else if (data === Object(data)) {
			let deep = find(data, type, next)
			if (deep && !next) return deep
		}
	}
	return null
}

exports.find = find
exports.parse = parse
exports.stringify = stringify
