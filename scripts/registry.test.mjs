import { createRequire } from 'node:module';
const resolveFromSvelte = createRequire(
	new URL('../packages/svelte/package.json', import.meta.url)
).resolve;
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
			readFileSync(new URL(`../apps/web/static/r/${item.name}.json`, import.meta.url), 'utf8')
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
			assert.doesNotThrow(() => resolveFromSvelte(specifier));
			assert.ok(packages.some((pkg) => specifier === pkg || specifier.startsWith(pkg + '/')));
		}
	});
}
test('weather registry includes its background and transforms all aliases', async () => {
	const item = registry.items[0];
	assert.ok(item.files.some((f) => f.target === 'wxcn/WeatherShaderBackground.svelte'));
	const texture = item.files.find((f) => f.target === 'wxcn/cloud-texture.ts');
	assert.equal(texture?.type, 'registry:component');
	const embedded = texture.content.match(/data:image\/webp;base64,([^']+)/);
	assert.ok(embedded, 'Cloud texture is bundled for installed consumers');
	assert.deepEqual(
		Buffer.from(embedded[1], 'base64'),
		readFileSync(new URL('../packages/svelte/src/assets/weather-clouds.webp', import.meta.url))
	);
	for (const file of item.files) {
		const result = await transformImports({ content: file.content, config: { aliases } });
		assert.ok(!/\$(UI|LIB|COMPONENTS|UTILS)\$/.test(result.content));
		if (file.target === 'wxcn/WeatherForecast.svelte')
			assert.ok(result.content.includes('$custom/primitives/card'));
	}
});

test('framework paths preserve legacy Svelte payloads and never leak workspace imports', () => {
	for (const item of registry.items) {
		const native = JSON.parse(
			readFileSync(
				new URL(`../apps/web/static/r/svelte/${item.name}.json`, import.meta.url),
				'utf8'
			)
		);
		assert.deepEqual(native, item);
		for (const file of native.files) assert.ok(!file.content.includes('@wxcn/'), file.target);
	}
	const frameworks = JSON.parse(
		readFileSync(new URL('../tooling/contracts/frameworks.json', import.meta.url), 'utf8')
	);
	assert.deepEqual(
		frameworks.svelte.components.toSorted(),
		registry.items.map((i) => i.name).toSorted()
	);
	for (const name of ['react', 'vue']) {
		assert.equal(frameworks[name].status, 'planned');
		assert.deepEqual(frameworks[name].components, []);
	}
});
