import { rm, symlink } from 'fs/promises'
import { existsSync } from 'fs'

const main = async (...pkgs) => {
	for (const pkg of pkgs) {
		const sourceURL = new URL('../packages/' + pkg, import.meta.url)
		const targetURL = new URL('../node_modules/' + pkg, import.meta.url)

		if (!existsSync(sourceURL)) {
			console.error(`Whoops! Could not link ${pkg}.`)
		} else {
			await rm(targetURL, { force: true, recursive: true })

			await symlink(sourceURL, targetURL, 'dir')

			console.log(`Successfully mapped ${pkg}.`)
		}
	}
}

main(
	'astro-module-html',
	'snowpack-module-html'
)
