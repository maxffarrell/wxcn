import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { encodePreset, PRESET_STYLES } from 'shadcn-svelte/preset';
const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1280, height: 900 },
	reducedMotion: 'reduce'
});
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route('**/api/**', (route) =>
	route.fulfill({ status: 503, json: { message: 'Fixture mode' } })
);
const base = process.env.WXCN_SITE_URL ?? 'http://127.0.0.1:8799';
const metrics = () =>
	page.locator('[data-slot="capture-target"] [data-slot="card"]').evaluateAll((cards) =>
		cards.slice(0, 2).map((c) => {
			const s = getComputedStyle(c);
			const h = getComputedStyle(c.querySelector('[data-slot="card-header"]'));
			const t = getComputedStyle(c.querySelector('[data-slot="card-title"]'));
			return {
				width: Math.round(c.getBoundingClientRect().width),
				radius: s.borderRadius,
				padding: s.padding,
				gap: s.gap,
				headerPadding: h.padding,
				titleFont: t.fontSize,
				titleWeight: t.fontWeight,
				height: Math.round(c.getBoundingClientRect().height)
			};
		})
	);
try {
	for (const style of PRESET_STYLES) {
		const values = [];
		for (const path of ['/', '/react']) {
			await page.goto(`${base}${path}?preset=${encodePreset({ style })}`);
			await page.locator('[data-slot="designer"]').waitFor();
			await page.waitForLoadState('networkidle');
			await page.getByRole('button', { name: 'Style', exact: true }).waitFor();
			await page.waitForFunction(
				(style) =>
					document
						.querySelector('[data-slot="preview-frame"]')
						?.classList.contains('style-' + style),
				style
			);
			await page.waitForFunction(() => document.fonts.status === 'loaded');
			values.push(await metrics());
		}
		assert.deepEqual(values[1], values[0], style);
		console.log(
			style,
			values.map((v) => v.map((c) => c.height))
		);
	}
	await page.getByRole('button', { name: 'Icon library', exact: true }).click();
	const names = await page.getByRole('menuitemradio').allTextContents();
	console.log('icons', names);
	await page.keyboard.press('Escape');
	for (const name of names) {
		await page.getByRole('button', { name: 'Icon library', exact: true }).click();
		await page.getByRole('menuitemradio', { name: name.trim(), exact: true }).click();
		await page.locator('[data-react-forecast="weather"] svg').first().waitFor();
	}
	await page.getByRole('button', { name: 'Get Code', exact: true }).click();
	assert.match(
		await page.getByRole('dialog').innerText(),
		/shadcn@latest.*\/r\/react\/forecast-dashboard\.json/
	);
	await page.keyboard.press('Escape');
	await page.getByRole('link', { name: 'Components', exact: true }).click();
	await page.locator('[data-react-forecast="dashboard"]').waitFor();
	assert.ok(page.url().includes('/react/docs/components'));
	await page.goto(base + '/react?item=weather');
	await page.setViewportSize({ width: 375, height: 900 });
	await page.locator('[data-react-forecast="weather"]').first().waitFor();
	assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
	await page.screenshot({ path: '/tmp/wxcn-react-site-mobile.png', fullPage: true });
	await page.goto(base + '/react');
	await page.getByRole('link', { name: 'Svelte', exact: true }).click();
	assert.equal(new URL(page.url()).pathname, '/');
	assert.deepEqual(errors, []);
	console.log(
		'Website styles, all native icons, docs, installation command, mobile layout and hydration passed.'
	);
} finally {
	await browser.close();
}
