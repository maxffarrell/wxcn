import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compile } from 'svelte/compiler';
import { registryItemSchema } from 'shadcn-svelte/schema';
import { transformIcons } from 'shadcn-svelte/transformers/icons';
import { transformImports } from 'shadcn-svelte/transformers/imports';
const registry = JSON.parse(readFileSync(new URL('../registry.json', import.meta.url), 'utf8'));
const aliases = {
	lib: '$custom',
	components: '$custom/components',
	ui: '$custom/primitives',
	utils: '$custom/cn',
	hooks: '$custom/hooks'
};
const libraries = {
	lucide: ['@lucide/svelte'],
	tabler: ['@tabler/icons-svelte'],
	hugeicons: ['@hugeicons/svelte', '@hugeicons/core-free-icons'],
	phosphor: ['phosphor-svelte'],
	remixicon: ['remixicon-svelte']
};
for (const item of registry.items) {
	test(`${item.name} is self-contained and does not replace consumer primitives or theme`, () => {
		registryItemSchema.parse(item);
		assert.ok(!item.css && !item.cssVars);
		assert.ok(item.files.every((f) => f.content && !f.target.startsWith('ui/')));
		assert.ok(item.files.every((f) => !f.content.includes('var(--wxcn-')));
		const served = JSON.parse(
			readFileSync(new URL(`../static/r/${item.name}.json`, import.meta.url), 'utf8')
		);
		assert.deepEqual(served, item);
	});
}
for (const [iconLibrary, packages] of Object.entries(libraries)) {
	test(`${iconLibrary}: native CLI transform resolves icons and custom aliases`, async () => {
		const source = registry.items[0].files.find((f) => f.target === 'icons/forecast-icons.svelte');
		const result = await transformIcons({
			content: source.content,
			filePath: source.target,
			config: { iconLibrary, aliases }
		});
		assert.deepEqual(result.devDependencies, packages);
		assert.ok(!result.content.includes('IconPlaceholder'));
		const transformed = await transformImports({ content: result.content, config: { aliases } });
		assert.ok(transformed.content.includes('$custom/data/types.js'));
		const { warnings } = compile(transformed.content, {
			filename: 'forecast-icons.svelte',
			generate: 'server'
		});
		assert.equal(warnings.length, 0);
		for (const [, specifier] of transformed.content.matchAll(/from ['"]([^'"]+)['"]/g)) {
			if (specifier.startsWith('$')) continue;
			assert.doesNotThrow(() => import.meta.resolve(specifier));
			assert.ok(packages.some((pkg) => specifier === pkg || specifier.startsWith(pkg + '/')));
		}
	});
}
test('weather registry includes its background and transforms all aliases', async () => {
	const item = registry.items[0];
	assert.ok(item.files.some((f) => f.target === 'wxcn/WeatherShaderBackground.svelte'));
	for (const file of item.files) {
		const result = await transformImports({ content: file.content, config: { aliases } });
		assert.ok(!/\$(UI|LIB|COMPONENTS|UTILS)\$/.test(result.content));
		if (file.target === 'wxcn/WeatherForecast.svelte')
			assert.ok(result.content.includes('$custom/primitives/card'));
	}
});
