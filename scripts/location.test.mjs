import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coordinates, loadForecast, nearestStation } from '../src/lib/server/forecast.ts';
import { getCommand } from '../src/lib/package-manager.ts';
const austin = { latitude: 30.2672, longitude: -97.7431 };
test('location input rejects missing, invalid, and out-of-range coordinates', () => {
	for (const query of [
		'',
		'?latitude=&longitude=',
		'?latitude=NaN&longitude=3',
		'?latitude=91&longitude=0',
		'?latitude=30&longitude=181'
	])
		assert.throws(() => coordinates(new URL(`https://example.com/${query}`)));
	assert.deepEqual(
		coordinates(new URL('https://example.com/?latitude=30.2672&longitude=-97.7431')),
		austin
	);
});
test('inland visitors are not assigned an unrelated coastal station', () => {
	const stations = [{ id: '8771450', name: 'Galveston', lat: 29.31, lng: -94.7933 }];
	assert.equal(nearestStation(austin, stations), null);
	assert.equal(nearestStation(austin, stations, Infinity).id, '8771450');
	assert.equal(nearestStation({ latitude: 29.3, longitude: -94.8 }, stations).id, '8771450');
});
test('NWS location lookup uses visitor coordinates and resolves local forecast', async () => {
	const requests = [];
	const periods = [{ name: 'Today', temperature: 96 }];
	const fetcher = async (url) => {
		requests.push(String(url));
		return Response.json(
			requests.length === 1
				? {
						properties: {
							forecast: 'https://api.weather.gov/gridpoints/EWX/155,90/forecast',
							relativeLocation: { properties: { city: 'Austin', state: 'TX' } },
							timeZone: 'America/Chicago'
						}
					}
				: { properties: { periods, updated: '2026-09-06T18:00:00Z' } }
		);
	};
	const result = await loadForecast(austin, fetcher);
	assert.match(requests[0], /30\.2672,-97\.7431/);
	assert.equal(result.location.label, 'Austin, TX');
	assert.deepEqual(result.forecast, periods);
});
test('provider errors and empty forecasts do not become fabricated local weather', async () => {
	await assert.rejects(
		loadForecast(austin, async () => new Response('', { status: 404 })),
		/unavailable/
	);
	let calls = 0;
	await assert.rejects(
		loadForecast(austin, async () =>
			Response.json(
				++calls === 1
					? { properties: { forecast: 'https://api.weather.gov/forecast' } }
					: { properties: { periods: [] } }
			)
		),
		/No forecast/
	);
});
test('PMBlock resolves installation commands for every package manager', () => {
	const args = ['shadcn-svelte@latest', 'add', 'https://example.com/r/weather-forecast.json'];
	for (const [pm, prefix] of [
		['pnpm', 'pnpm dlx'],
		['npm', 'npx'],
		['yarn', 'npx'],
		['bun', 'bun x']
	]) {
		const cmd = getCommand(pm, 'execute', args);
		const text = `${cmd.command} ${cmd.args.join(' ')}`;
		assert.ok(text.startsWith(prefix), text);
		assert.ok(text.includes(args[2]));
	}
});
