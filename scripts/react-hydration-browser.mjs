import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { encodePreset } from 'shadcn-svelte/preset';

const base = process.env.WXCN_SITE_URL ?? 'http://127.0.0.1:8799';
const timeZones = ['America/Chicago', 'UTC', 'Asia/Tokyo'];
const routes = [
	{ name: 'root', path: '/react' },
	{ name: 'lyra', path: `/react?preset=${encodeURIComponent(encodePreset({ style: 'lyra' }))}` }
];
const browser = await chromium.launch();
const failures = [];

try {
	for (const timeZoneId of timeZones) {
		for (const route of routes) {
			const context = await browser.newContext({
				timezoneId: timeZoneId,
				viewport: { width: 1280, height: 900 },
				reducedMotion: 'reduce'
			});
			const page = await context.newPage();
			page.setDefaultTimeout(15000);
			const errors = [];
			const record = (kind, message) => {
				errors.push({ kind, message, url: page.url() });
			};
			page.on('pageerror', (error) => record('pageerror', error.message));
			page.on('console', (message) => {
				if (
					['warning', 'error'].includes(message.type()) &&
					/(hydration|hydrating|mismatch|Minified React error #418)/i.test(message.text())
				)
					record(`console.${message.type()}`, message.text());
			});
			await page.route('**/api/**', (request) =>
				request.fulfill({ status: 503, json: { message: 'Hydration fixture mode' } })
			);

			try {
				const url = new URL(route.path, base).href;
				const response = await page.goto(url, { waitUntil: 'networkidle' });
				assert.equal(response?.status(), 200, `${url} returned ${response?.status()}`);
				await page.locator('[data-slot="designer"]').waitFor();
				for (const kind of ['weather', 'moon', 'tides']) {
					const host = page.locator(`[data-react-forecast="${kind}"]`).first();
					await expect(host, `${kind} host at ${url}`).toBeVisible();
					await expect(
						host.locator('[data-slot="card"]'),
						`${kind} native card at ${url}`
					).toBeVisible();
				}

				const expectedStyle = route.name === 'lyra' ? 'lyra' : 'nova';
				await expect(page.locator('[data-slot="preview-frame"]')).toHaveClass(
					new RegExp(`(?:^|\\s)style-${expectedStyle}(?:\\s|$)`)
				);

				// Exercise a preset prop update after React has mounted.
				await page.getByRole('button', { name: 'Style', exact: true }).click();
				const nextStyle = expectedStyle === 'lyra' ? 'Nova' : 'Lyra';
				await page.getByRole('menuitemradio', { name: nextStyle, exact: true }).click();
				await expect(page.locator('[data-slot="preview-frame"]')).toHaveClass(
					new RegExp(`(?:^|\\s)style-${nextStyle.toLowerCase()}(?:\\s|$)`)
				);
				await expect(
					page.locator('[data-react-forecast="weather"] [data-slot="card"]').first()
				).toBeVisible();

				assert.deepEqual(errors, [], `${timeZoneId} ${route.name} hydration errors`);
				console.log(`passed ${timeZoneId} ${route.name} ${url}`);
			} catch (error) {
				failures.push({
					timeZoneId,
					route: route.name,
					url: page.url() || new URL(route.path, base).href,
					error: error instanceof Error ? error.message : String(error),
					errors
				});
			} finally {
				await context.close();
			}
		}
	}
} finally {
	await browser.close();
}

if (failures.length) {
	console.error(JSON.stringify(failures, null, 2));
	process.exitCode = 1;
} else {
	console.log('React production hydration passed in all time zones and preset states.');
}
