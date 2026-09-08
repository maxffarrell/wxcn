// Registry icon placeholders are expanded by shadcn during CLI installation.
// Manual documentation uses the same explicit Lucide attributes as the registry.
/** @param {string} source */
export function reactManualIcons(source) {
	if (!source.includes('IconPlaceholder')) return source;
	const imports = new Set();
	let content = source.replace(
		/import\s*\{\s*IconPlaceholder\s*\}\s*from\s*['"][^'"]+['"];?\s*/,
		''
	);
	content = content.replace(/<IconPlaceholder\s+([^>]+)\/>/g, (_match, attributes) => {
		const name = attributes.match(/\blucide="([A-Za-z_$][\w$]*)"/)?.[1];
		if (!name) throw new Error('React manual icons require an explicit Lucide icon attribute.');
		imports.add(name);
		const props = attributes
			.replace(/\b(?:lucide|tabler|phosphor|hugeicons|remixicon)="[^"]*"\s*/g, '')
			.trim();
		return `<${name} ${props} />`;
	});
	if (!imports.size || content.includes('IconPlaceholder')) {
		throw new Error('Unsupported React icon placeholder in manual documentation.');
	}
	return `import { ${[...imports].sort().join(', ')} } from 'lucide-react';\n${content}`;
}
