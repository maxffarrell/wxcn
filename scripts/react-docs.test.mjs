import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { reactManualIcons } from '../apps/web/scripts/react-docs-icons.mjs';

const registry = JSON.parse(
	await readFile(new URL('../packages/react/registry.json', import.meta.url), 'utf8')
);

test('React manual icons use real Lucide exports and retain native type contracts', () => {
	const helper = registry.items
		.flatMap((item) => item.files)
		.find((file) => file.target.endsWith('/forecast-icons.tsx'));
	assert.ok(helper);
	const code = reactManualIcons(helper.content);
	assert.doesNotMatch(code, /IconPlaceholder|icon-placeholder/);
	assert.match(code, /from 'lucide-react'/);
	assert.match(code, /export type IconName\s*=/);
	assert.match(code, /export type IconSet\s*=/);
	assert.match(code, /export type ForecastIconProps\s*=/);
	assert.match(code, /className=\{className\} aria-hidden="true"/);
	for (const [, name] of helper.content.matchAll(/lucide="([^"]+)"/g)) {
		assert.ok(code.includes(`<${name} `), name);
	}
	assert.equal(reactManualIcons(code), code);
});

test('React manual icons reject unresolved or malformed registry placeholders', () => {
	assert.throws(() => reactManualIcons('<IconPlaceholder tabler="IconSun" />'), /explicit Lucide/);
	assert.throws(
		() => reactManualIcons('<IconPlaceholder />'),
		/Unsupported React icon placeholder/
	);
});
