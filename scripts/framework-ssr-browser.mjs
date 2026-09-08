import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
const base = process.env.WXCN_SITE_URL ?? 'http://127.0.0.1:8799';
try {
	for (const framework of ['react', 'vue']) {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		const response = await page.goto(`${base}/${framework}`);
		assert.equal(response.status(), 200);
		for (const kind of ['weather', 'moon']) {
			const cards = page.locator(`[data-${framework}-forecast="${kind}"] [data-slot="card"]`);
			assert.ok((await cards.count()) > 0, `${framework} ${kind} renders without JavaScript`);
			await expect(cards.first()).toBeVisible();
		}
		const ids = await page
			.locator(`[data-${framework}-forecast] svg [id]`)
			.evaluateAll((nodes) => nodes.map((node) => node.id));
		assert.ok(ids.length > 0, `${framework} has server-rendered lunar artwork`);
		assert.equal(new Set(ids).size, ids.length, `${framework} SVG IDs are unique across instances`);
		await context.close();
	}
	console.log('React and Vue cards render without JavaScript and preserve unique SVG IDs.');
} finally {
	await browser.close();
}
