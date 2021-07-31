import { createHash } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import { cwd } from 'process'

const main = () => {
	const patchForEsmDev = {
		file: new URL('../node_modules/snowpack/lib/esm/commands/dev.js', import.meta.url),
		hash: {
			prior: '92b5e5e6871da1350c2eab0a37c59d42',
			after: '30c17c32e2b1e7684a07015b8974c06f',
		},
		diff: [
			[21873, 21962, ''],
			[24051, 24140, ''],
		],
	}

	const patchForCjsDev = {
		file: new URL('../node_modules/snowpack/lib/cjs/commands/dev.js', import.meta.url),
		hash: {
			prior: '7abddc3abf5e2c43e7ad022bf07c044d',
			after: 'ea226ddebfad9b767fdf08d66456ee55',
		},
		diff: [
			[23832, 23920, ''],
			[26079, 26167, '']
		]
	}

	patchFileSync(
		patchForEsmDev.file,
		patchForEsmDev.hash.prior,
		patchForEsmDev.hash.after,
		...patchForEsmDev.diff
	)

	patchFileSync(
		patchForCjsDev.file,
		patchForCjsDev.hash.prior,
		patchForCjsDev.hash.after,
		...patchForCjsDev.diff
	)
}

const patchFileSync = (
	/** @type {URL} */
	fileURL,
	/** @type {string} */
	md5prior,
	/** @type {string} */
	md5after,
	/** @type {[number, number, string][]} */
	...diff
) => {
	const str = readFileSync(fileURL, 'utf8')
	const md5 = createHash('md5').update(str).digest('hex')
	const rel = fileURL.pathname.slice(new URL(cwd() + '/', 'file:').pathname.length)

	if (md5 === md5after) {
		console.log(`Successfully patched ${rel} (already).`)
	} else if (md5 === md5prior) {
		writeFileSync(
			fileURL,
			diff.reduce(
				(
					patched,
					[lead, tail, text]
				) => patched.slice(0, lead) + text + patched.slice(tail),
				str
			)
		)

		console.log(`Successfully patched ${rel}.`)
	} else {
		console.log(`Could not patch ${rel}.`)
	}
}

main()
