import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { sampleTides, sampleTideSeries, sampleTideTime } from '../packages/core/src/tides.ts';
const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1280, height: 900 },
	reducedMotion: 'reduce'
});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
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
		let index = 0;
		while (
			index < (await cards.count()) &&
			!(await cards
				.nth(index)
				.getByRole('button', { name: /View .* week|Upcoming tides/ })
				.count())
		)
			index++;
		const card = cards.nth(index);
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
		const week = card.getByRole('button', { name: /View .* week|Upcoming tides/ });
		const before = await card.boundingBox();
		await week.click();
		const screen = card.locator('[data-slot="forecast-screen"]');
		await screen.waitFor();
		assert.equal(
			Math.round((await card.boundingBox()).height),
			Math.round(before.height),
			kind + ' fixed height'
		);
		if (kind === 'tides') {
			await expect(screen.locator('[data-slot="upcoming-tides"] > div').first()).toBeVisible();
		} else {
			if (kind === 'moon') {
				await card.evaluate((el) => {
					const table = el.querySelector('[data-slot="forecast-week-table"]');
					el.style.height = `${el.getBoundingClientRect().height + 200 - table.clientHeight}px`;
				});
				await expect(screen.locator('[data-forecast-day]')).toHaveCount(7);
			}
			const day = screen.locator('[data-forecast-day]').nth(kind === 'moon' ? 4 : 0);
			const key = await day.getAttribute('data-forecast-day');
			await day.click();
			await screen.getByRole('button', { name: 'Back', exact: true }).waitFor();
			assert.equal(await card.locator('[data-slot="card"]').count(), 0, kind + ' no nested cards');
			if (kind === 'moon')
				await card.evaluate(
					(el) => (el.style.height = `${el.getBoundingClientRect().height - 96}px`)
				);
			await page.keyboard.press('Escape');
			await expect(screen.locator(`[data-forecast-day="${key}"]`)).toBeFocused();
			if (kind === 'moon') await expect(screen.locator('[data-forecast-day]')).toHaveCount(7);
		}
		await screen.getByRole('button', { name: 'Back', exact: true }).click();
		await expect(week).toBeFocused();
		assert.equal(
			await page.locator('form[data-submitted]').count(),
			0,
			kind + ' no form submission'
		);
		if (kind !== 'moon') {
			const defaultCard = cards.first();
			const entry = defaultCard.getByRole('button', { name: /View (tide )?details/ }).first();
			await entry.click();
			await defaultCard.locator('[data-slot="forecast-screen"]').waitFor();
			await page.keyboard.press('Escape');
			await expect(entry).toBeFocused();
		}
		console.log(kind, 'compact summary, day navigation, contained layout, resize and focus passed');
	}
	assert.deepEqual(errors, []);
} finally {
	await browser.close();
}
