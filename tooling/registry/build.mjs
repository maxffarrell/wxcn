import { mkdir, writeFile } from 'node:fs/promises';
import { reactRegistry } from './adapters/react.mjs';
import { svelteRegistry } from './adapters/svelte.mjs';
const root = new URL('../../', import.meta.url);
async function write(path, value) {
	const url = new URL(path, root);
	await mkdir(new URL('.', url), { recursive: true });
	await writeFile(url, JSON.stringify(value, null, 2) + '\n');
}
// Each future framework adapter owns its schema, aliases, icons and dependencies.
// Never publish placeholders as installable framework implementations.
for (const item of svelteRegistry.items) {
	await write(`apps/web/static/r/svelte/${item.name}.json`, item);
	await write(`apps/web/static/r/${item.name}.json`, item);
}
await write('apps/web/static/r/svelte/registry.json', svelteRegistry);
await write('packages/svelte/registry.json', svelteRegistry);
await write('apps/web/registry.json', svelteRegistry);
await write('registry.json', svelteRegistry);
console.log(`Built ${svelteRegistry.items.length} Svelte items with legacy URL compatibility.`);

for (const item of reactRegistry.items)
	await write(`apps/web/static/r/react/${item.name}.json`, item);
await write('apps/web/static/r/react/registry.json', reactRegistry);
await write('packages/react/registry.json', reactRegistry);
console.log(`Built ${reactRegistry.items.length} React items.`);
