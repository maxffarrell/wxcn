import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registrySchema, registryItemSchema } from 'shadcn/schema';
const registry = JSON.parse(
	readFileSync(new URL('../packages/react/registry.json', import.meta.url), 'utf8')
);
test('React registry is schema-valid, self-contained and uses native consumer primitives', () => {
	registrySchema.parse(registry);
	const frameworks = JSON.parse(
		readFileSync(new URL('../tooling/contracts/frameworks.json', import.meta.url), 'utf8')
	);
	assert.equal(frameworks.react.status, 'available');
	assert.deepEqual(
		frameworks.react.components.toSorted(),
		registry.items.map((i) => i.name).toSorted()
	);
	for (const item of registry.items) {
		registryItemSchema.parse(item);
		assert.deepEqual(
			JSON.parse(
				readFileSync(
					new URL(`../apps/web/static/r/react/${item.name}.json`, import.meta.url),
					'utf8'
				)
			),
			item
		);
		assert.ok(!item.css && !item.cssVars);
		for (const file of item.files) {
			assert.ok(file.content);
			assert.ok(!/@wxcn\/|\.svelte|\$lib/.test(file.content), file.path);
			assert.match(file.target, /^@(components|lib)\/wxcn\//);
		}
	}
	assert.deepEqual(registry.items.find((i) => i.name === 'tide-forecast').registryDependencies, [
		'card',
		'badge',
		'chart'
	]);
});
