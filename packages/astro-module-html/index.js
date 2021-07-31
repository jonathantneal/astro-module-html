export default {
	name: 'astro-module-html',
	server: './server.js',
	snowpackPlugin: 'snowpack-module-html',
	external: [
		'linkedom'
	],
	external: [
		'acorn',
		'astring',
		'linkedom'
	],
}
