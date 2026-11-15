import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const source = await readFile(new URL('../apps/web/src/lib/webmcp.ts', import.meta.url), 'utf8');

test('WebMCP exposes only bounded navigation and read-only page discovery', () => {
	assert.match(source, /modelContext/);
	assert.match(source, /provideContext\(\{ tools: webmcpTools \}\)/);
	assert.match(source, /provideContext\(\{ tools: \[\] \}\)/);
	assert.match(source, /additionalProperties: false/);
	assert.match(source, /readOnlyHint: true/);
	assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|password|submit\(/i);
});

test('WebMCP preserves the current framework and supports an explicit framework switch', async () => {
	const { webmcpTools } = await import('../apps/web/src/lib/webmcp.ts');
	const original = globalThis.window;
	const navigations = [];
	globalThis.window = {
		location: { pathname: '/react/docs/components', assign: (href) => navigations.push(href) }
	};
	try {
		const navigate = webmcpTools.find((tool) => tool.name === 'navigate_to_wxcn_page');
		const list = webmcpTools.find((tool) => tool.name === 'list_wxcn_pages');
		await navigate.execute({ page: 'home' });
		await navigate.execute({ page: 'components' });
		await navigate.execute({ page: 'dataSources', framework: 'svelte' });
		assert.deepEqual(navigations, ['/react', '/react/docs/components', '/docs/endpoints']);
		assert.deepEqual(
			(await list.execute({})).map((page) => page.href),
			['/react', '/react/docs/components', '/react/docs/endpoints']
		);
		assert.equal((await list.execute({ framework: 'svelte' }))[0].href, '/');
		assert.deepEqual(
			(await list.execute({ framework: 'vue' })).map((page) => page.href),
			['/vue', '/vue/docs/components', '/vue/docs/endpoints']
		);
		await navigate.execute({ page: 'components', framework: 'vue' });
		assert.equal(navigations.at(-1), '/vue/docs/components');
		await assert.rejects(navigate.execute({ page: 'toString' }), /valid wxcn page/);
		await assert.rejects(list.execute({ framework: 'unknown' }), /Choose Svelte, React, or Vue/);
	} finally {
		if (original === undefined) delete globalThis.window;
		else globalThis.window = original;
	}
});
