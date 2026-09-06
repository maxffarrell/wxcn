import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tideState, tideTimestamp } from '../src/lib/data/tide-state.ts';
const now = Date.parse('2026-09-06T16:00:00Z');
const events = [
	{ time: '2026-09-06T13:00:00Z', height: '0.3', type: 'L' },
	{ time: '2026-09-06T19:00:00Z', height: '1.5', type: 'H' }
];
const points = [
	{ time: '2026-09-06T15:54:00Z', height: '.8' },
	{ time: '2026-09-06T16:06:00Z', height: '1.0' }
];
test('tides bracket now using actual timestamps across timezone offsets', () => {
	const result = tideState(events, points, null, now);
	assert.equal(result.previous.type, 'L');
	assert.equal(result.next.type, 'H');
	assert.equal(result.predicted, 0.9);
	assert.equal(tideTimestamp('2026-09-06T11:00:00-05:00'), now);
});
test('fresh observation takes precedence; stale or invalid readings fall back to prediction', () => {
	const reading = { time: '2026-09-06T15:54:00Z', height: '1.1' };
	assert.equal(tideState(events, points, reading, now).level, 1.1);
	for (const bad of [
		{ ...reading, time: '2026-09-06T14:00:00Z' },
		{ ...reading, height: '' },
		{ ...reading, height: 'NaN' },
		{ ...reading, time: '2026-09-06T17:00:00Z' }
	])
		assert.equal(tideState(events, points, bad, now).observed, null);
});
test('extrema alone never fabricate a current reading and series do not extrapolate', () => {
	assert.equal(tideState(events, [], null, now).level, null);
	assert.equal(tideState(events, points, null, now + 3600000).level, null);
	assert.equal(tideState([], [], null, now).next, undefined);
});

test('NOAA uses UTC and fetches past/future extrema, continuous predictions, and observations', async () => {
	const { loadTides } = await import('../src/lib/server/forecast.ts');
	const requests = [];
	const result = await loadTides(
		{ latitude: 30.2672, longitude: -97.7431, timeZone: 'America/Chicago' },
		async (input) => {
			const url = new URL(input);
			requests.push(url);
			if (url.pathname.includes('stations'))
				return Response.json({
					stations: [{ id: '8771450', name: 'Galveston', lat: 29.31, lng: -94.79 }]
				});
			const product = url.searchParams.get('product');
			if (product === 'water_level')
				return Response.json({ data: [{ t: '2026-09-06 16:00', v: '1.1' }] });
			return Response.json({
				predictions: [
					{ t: '2026-09-06 13:00', v: '.3', type: 'L' },
					{ t: '2026-09-06 19:00', v: '1.5', type: 'H' }
				]
			});
		}
	);
	assert.equal(result.reading.time, '2026-09-06T16:00Z');
	assert.equal(result.station.timeZone, 'America/Chicago');
	assert.equal(result.series.length, 2);
	assert.equal(result.station.station, '8771450');
	assert.ok(result.station.distanceKm > 100);
	for (const url of requests.slice(1)) assert.equal(url.searchParams.get('time_zone'), 'gmt');
	assert.ok(requests.some((url) => url.searchParams.get('interval') === '6'));
	const start = requests
		.find((url) => url.searchParams.has('begin_date'))
		.searchParams.get('begin_date');
	assert.notEqual(start.slice(0, 8), new Date().toISOString().slice(0, 10).replaceAll('-', ''));
});
