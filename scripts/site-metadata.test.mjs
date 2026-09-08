import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { publicRoutes, siteUrl } from '../apps/web/src/lib/site-routes.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('robots.txt permits public discovery and points to the sitemap', async () => {
	const robots = await read('apps/web/static/robots.txt');
	assert.match(robots, /^User-agent: \*$/m);
	assert.match(robots, /^Allow: \/$/m);
	assert.match(robots, /^Disallow: \/api\/$/m);
	assert.match(robots, /^Sitemap: https:\/\/wxcn\.dev\/sitemap\.xml$/m);
});

test('public route manifest contains the canonical Astro pages', async () => {
	assert.deepEqual(publicRoutes, [
		'/',
		'/docs/components',
		'/docs/endpoints',
		'/shader-preview',
		'/react',
		'/react/docs/components',
		'/react/docs/endpoints',
		'/vue',
		'/vue/docs/components',
		'/vue/docs/endpoints'
	]);
	assert.equal(siteUrl, 'https://wxcn.dev');
	assert.match(await read('apps/web/src/pages/sitemap.xml.ts'), /publicRoutes/);
	assert.match(await read('apps/web/src/pages/index.astro'), /<Site>/);
	for (const route of publicRoutes.slice(1)) {
		assert.ok(route.startsWith('/'));
		assert.ok(!route.endsWith('/'));
	}
});
