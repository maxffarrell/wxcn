import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
	await page.goto(process.env.REACT_PREVIEW_URL ?? 'http://127.0.0.1:5173');
	await page.getByRole('heading', { name: 'Forecast components for React' }).waitFor();
	for (const width of [375, 1280]) {
		await page.setViewportSize({ width, height: 1000 });
		for (const size of ['sm', 'default', 'lg']) {
			await page.getByRole('combobox', { name: /^Size/ }).selectOption(size);
			for (const density of ['compact', 'comfortable']) {
				await page.getByRole('combobox', { name: /^Density/ }).selectOption(density);
				for (const type of ['simple', 'summary', 'detailed']) {
					await page.getByRole('combobox', { name: /^Detail/ }).selectOption(type);
					assert.equal(await page.locator('[data-slot="card"]').count(), 3);
					assert.equal(
						await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
						false,
						`Overflow ${width} ${size} ${density} ${type}`
					);
				}
			}
		}
	}
	await page.getByRole('button', { name: 'Metric units' }).click();
	await page.getByRole('button', { name: 'Dark mode' }).click();
	await page.getByRole('button', { name: 'Animate weather' }).click();
	await page.getByRole('combobox', { name: /^Size/ }).selectOption('default');
	const chart = page.locator('.recharts-wrapper');
	const box = await chart.boundingBox();
	assert.ok(box);
	await chart.hover({ position: { x: box.width * 0.65, y: box.height * 0.5 } });
	await page.getByText('Selected time', { exact: true }).waitFor();
	await page.getByText('Predicted water level', { exact: true }).waitFor();
	assert.match(await page.locator('.recharts-tooltip-wrapper').innerText(), /\d+\.\d+\s*m/);
	await page.mouse.move(0, 0);
	await page.locator('.recharts-surface').focus();
	await page.keyboard.press('ArrowRight');
	await page.getByText('Predicted water level', { exact: true }).waitFor();
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.setViewportSize({ width: 375, height: 1000 });
	await page.screenshot({ path: '/tmp/wxcn-react-mobile-dark.png', fullPage: true });
	assert.deepEqual(errors, []);
	console.log(
		'36 responsive size/density/detail combinations, metric hover, keyboard chart, dark mode and reduced-motion rendering passed without page errors.'
	);
} finally {
	await browser.close();
}
