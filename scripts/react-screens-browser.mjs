import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { sampleTides, sampleTideSeries, sampleTideTime } from '../packages/core/src/tides.ts';
const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1280, height: 900 },
	reducedMotion: 'reduce'
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const shift = Date.now() - sampleTideTime;
const shifted = (entries) =>
	entries.map((entry) => ({
		...entry,
		time: new Date(Date.parse(entry.time) + shift).toISOString()
	}));
await page.route('**/api/**', (route) =>
	new URL(route.request().url()).pathname === '/api/tides'
		? route.fulfill({
				json: {
					predictions: shifted(sampleTides),
					series: shifted(sampleTideSeries),
					reading: null,
					station: {
						label: 'Test station',
						latitude: 29.31,
						longitude: -94.79,
						timeZone: 'America/Chicago',
						distanceKm: 0
					}
				}
			})
		: route.fulfill({ status: 503, json: { message: 'Fixture mode' } })
);
const base = process.env.WXCN_SITE_URL ?? 'http://127.0.0.1:8799';
try {
	for (const kind of ['weather', 'moon', 'tides']) {
		await page.goto(`${base}/react?item=${kind}`);
		await page.waitForLoadState('networkidle');
		const cards = page.locator(`[data-react-forecast="${kind}"] [data-slot="card"]`);
		await cards.first().waitFor();
		let cardIndex = 0;
		while (
			cardIndex < (await cards.count()) &&
			!(await cards
				.nth(cardIndex)
				.getByRole('button', { name: /View .* week/ })
				.count())
		)
			cardIndex++;
		const card = cards.nth(cardIndex);
		await card.waitFor();
		await card.evaluate((el) => {
			const form = document.createElement('form');
			form.id = 'forecast-test-form';
			form.addEventListener('submit', (event) => {
				event.preventDefault();
				form.dataset.submitted = 'true';
			});
			document.body.append(form);
			const associate = () =>
				el.querySelectorAll('button').forEach((button) => button.setAttribute('form', form.id));
			new MutationObserver(associate).observe(el, { childList: true, subtree: true });
			associate();
		});
		const week = card.getByRole('button', { name: /View .* week/ });
		await week.waitFor();
		const before = await card.boundingBox();
		await week.click();
		const screen = card.locator('[data-slot="forecast-screen"]');
		await screen.waitFor();
		const after = await card.boundingBox();
		assert.equal(Math.round(after.height), Math.round(before.height), kind + ' fixed height');
		if (kind === 'moon') {
			const table = screen.locator('[data-slot="forecast-week-table"]');
			const height = await table.evaluate((el) => el.clientHeight);
			await card.evaluate(
				(el, delta) => (el.style.height = `${el.getBoundingClientRect().height + delta}px`),
				100 - height
			);
			await page.waitForFunction(
				() => document.querySelector('[data-slot="forecast-screen"] tbody')?.children.length === 2
			);
			const next = screen.getByRole('button', { name: 'Next forecast days' });
			await next.click();
			await next.click();
		}
		const dayButton = screen.locator('[data-forecast-day]').first();
		const key = await dayButton.getAttribute('data-forecast-day');
		await dayButton.click();
		await screen.getByRole('button', { name: 'Back', exact: true }).waitFor();
		assert.equal(await card.locator('[data-slot="card"]').count(), 0, kind + ' no nested cards');
		if (kind === 'moon')
			await card.evaluate(
				(el) => (el.style.height = `${el.getBoundingClientRect().height + 32}px`)
			);
		await page.keyboard.press('Escape');
		await screen.locator(`[data-forecast-day="${key}"]`).waitFor();
		if (kind === 'moon') await expect(screen.locator('tbody tr')).toHaveCount(3);
		await page.waitForFunction(
			(key) => document.activeElement?.getAttribute('data-forecast-day') === key,
			key
		);
		await screen.getByRole('button', { name: 'Back', exact: true }).click();
		await screen.waitFor({ state: 'detached' });
		await expect(week).toBeFocused();
		assert.equal(
			await page.locator('form[data-submitted]').count(),
			0,
			kind + ' navigation does not submit forms'
		);
		if (kind !== 'moon') {
			const defaultCard = cards.first();
			const entry = defaultCard.getByRole('button', { name: /View (tide )?details/ }).first();
			await entry.click();
			await defaultCard.locator('[data-slot="forecast-screen"]').waitFor();
			await page.keyboard.press('Escape');
			await expect(entry).toBeFocused();
		}
		console.log(kind, 'week/day, contained layout, Escape and Back focus passed');
	}
	assert.deepEqual(errors, []);
} finally {
	await browser.close();
}
