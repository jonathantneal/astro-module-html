import * as linkedom from 'linkedom'

const skippable = new Set([ 'parseHTML', 'parseJSON', 'toJSON', 'illegalConstructor', 'Facades', 'HTMLClasses'])

for (let name in linkedom) {
	if (!skippable.has(name)) {
		Object.defineProperty(
			globalThis,
			name,
			{
				value: linkedom[name],
				configurable: true,
				writable: true,
			}
		)
	}
}
