import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tideState, tideTimestamp } from '../packages/core/src/tide-state.ts';
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
	const { loadTides } = await import('../apps/web/src/lib/server/forecast.ts');
	const requests = [];
	const result = await loadTides(
		{ latitude: 40.7128, longitude: -74.006, timeZone: 'America/New_York' },
		async (input) => {
			const url = new URL(input);
			requests.push(url);
			if (url.pathname.includes('stations'))
				return Response.json({
					stations:
						url.searchParams.get('type') === 'tidepredictions'
							? [{ id: '8518750', name: 'The Battery', lat: 40.7006, lng: -74.0142, type: 'R' }]
							: [{ id: '8517847', name: 'Brooklyn Bridge', lat: 40.7033, lng: -73.995 }]
				});
			const product = url.searchParams.get('product');
			if (url.searchParams.get('station') !== '8518750')
				return Response.json({ error: { message: 'No continuous data' } });
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
	assert.equal(requests[0].searchParams.get('type'), 'tidepredictions');
	assert.equal(result.reading.time, '2026-09-06T16:00Z');
	assert.equal(result.station.timeZone, 'America/New_York');
	assert.equal(result.series.length, 2);
	assert.equal(result.station.station, '8518750');
	assert.ok(result.station.distanceKm < 5);
	for (const url of requests.slice(1)) assert.equal(url.searchParams.get('time_zone'), 'gmt');
	assert.ok(requests.some((url) => url.searchParams.get('interval') === '6'));
	const start = requests
		.find((url) => url.searchParams.has('begin_date'))
		.searchParams.get('begin_date');
	assert.notEqual(start.slice(0, 8), new Date().toISOString().slice(0, 10).replaceAll('-', ''));
});

test('station selection uses capabilities and distance across coastal regions', async () => {
	const { tideStation } = await import('../apps/web/src/lib/server/forecast.ts');
	const stations = [
		{ id: 'ny', name: 'New York', lat: 40.7, lng: -74.01, type: 'R' },
		{ id: 'sf', name: 'San Francisco', lat: 37.81, lng: -122.47, type: 'R' },
		{ id: 'hi', name: 'Honolulu', lat: 21.3, lng: -157.87, type: 'R' },
		{ id: 'ak', name: 'Juneau', lat: 58.3, lng: -134.41, type: 'R' },
		{ id: 'pr', name: 'San Juan', lat: 18.46, lng: -66.12, type: 'R' },
		{ id: 'sub', name: 'Local high/low station', lat: 44, lng: -68, type: 'S' },
		{ id: 'invalid', name: 'Invalid coordinates', lat: NaN, lng: 0, type: 'R' }
	];
	for (const station of stations.slice(0, 6)) {
		assert.equal(
			tideStation({ latitude: station.lat, longitude: station.lng }, stations).id,
			station.id
		);
	}
	for (const location of [
		{ latitude: 30.2672, longitude: -97.7431 },
		{ latitude: 41.88, longitude: -87.63 },
		{ latitude: 39.74, longitude: -104.99 },
		{ latitude: 51.5, longitude: -0.12 }
	])
		assert.equal(tideStation(location, stations), null);
	assert.equal(
		tideStation({ latitude: 40.7, longitude: -74.01 }, [
			{
				id: 'sub',
				name: 'Nearby subordinate',
				lat: 40.7,
				lng: -74.01,
				type: 'S',
				reference_id: 'ny'
			},
			stations[0]
		]).id,
		'ny'
	);
});

test('loader preserves prediction-only and high/low-only stations without inventing observations', async () => {
	const { loadTides } = await import('../apps/web/src/lib/server/forecast.ts');
	for (const continuous of [true, false]) {
		const result = await loadTides({ latitude: 44, longitude: -68 }, async (input) => {
			const url = new URL(input);
			if (url.pathname.includes('stations'))
				return Response.json({
					stations: [
						{ id: 'local', name: 'Local station', lat: 44, lng: -68, type: continuous ? 'R' : 'S' }
					]
				});
			if (url.searchParams.get('product') === 'water_level')
				return Response.json({ error: { message: 'No observations' } });
			if (url.searchParams.get('interval') === '6')
				return Response.json(
					continuous
						? {
								predictions: [
									{ t: '2026-09-06 15:54', v: '.8' },
									{ t: '2026-09-06 16:06', v: '1.0' },
									{ t: 'bad', v: '' }
								]
							}
						: { error: { message: 'High/low only' } }
				);
			return Response.json({
				predictions: [
					{ t: '2026-09-06 13:00', v: '.3', type: 'L' },
					{ t: '2026-09-06 19:00', v: '1.5', type: 'H' }
				]
			});
		});
		assert.equal(result.reading, null);
		assert.equal(result.predictions.length, 2);
		assert.equal(result.series.length, continuous ? 2 : 0);
		assert.equal(
			tideState(result.predictions, result.series, result.reading, now).level,
			continuous ? 0.9 : null
		);
	}
});

test('loader returns explicit no coverage without querying a distant station', async () => {
	const { loadTides } = await import('../apps/web/src/lib/server/forecast.ts');
	let calls = 0;
	const result = await loadTides({ latitude: 41.88, longitude: -87.63 }, async () => {
		calls++;
		return Response.json({
			stations: [{ id: 'ny', name: 'New York', lat: 40.7, lng: -74.01, type: 'R' }]
		});
	});
	assert.equal(calls, 1);
	assert.deepEqual(result, { station: null, predictions: [], series: [], reading: null });
});

test('subordinate fallback follows NOAA reference relationships instead of unrelated nearby water', async () => {
	const { tideStation } = await import('../apps/web/src/lib/server/forecast.ts');
	const location = { latitude: 44, longitude: -68 };
	const local = {
		id: 'local',
		name: 'Local inlet',
		lat: 44,
		lng: -68,
		type: 'S',
		reference_id: 'reference'
	};
	const unrelated = { id: 'other', name: 'Other inlet', lat: 44.01, lng: -68, type: 'R' };
	const reference = { id: 'reference', name: 'NOAA reference', lat: 44.1, lng: -68, type: 'R' };
	assert.equal(tideStation(location, [local, unrelated, reference]).id, 'reference');
	assert.equal(tideStation(location, [local, unrelated]).id, 'local');
	assert.equal(tideStation(location, [local, unrelated, { ...reference, lat: 46 }]).id, 'local');
});

test('demos expand beyond 100 km and select the nearest station with complete live data', async () => {
	const { loadTides } = await import('../apps/web/src/lib/server/forecast.ts');
	const checked = [];
	const candidates = [
		{ id: 'lake', name: 'Lake gauge', lat: 41.88, lng: -87.63, type: 'R' },
		{ id: 'stale', name: 'Stale reading', lat: 41, lng: -84, type: 'R' },
		{ id: 'partial', name: 'Incomplete predictions', lat: 40, lng: -81, type: 'R' },
		{ id: 'nearest-good', name: 'Nearest working station', lat: 39, lng: -78, type: 'R' },
		{ id: 'farther-good', name: 'Farther working station', lat: 38, lng: -75, type: 'R' }
	];
	const stamp = (offset) =>
		new Date(Date.now() + offset * 60000).toISOString().slice(0, 16).replace('T', ' ');
	const fetcher = async (input) => {
		const url = new URL(input);
		if (url.pathname.includes('stations'))
			return Response.json({
				stations: candidates.map((s) => ({
					...s,
					tidal: s.id !== 'lake',
					greatlakes: s.id === 'lake'
				}))
			});
		const id = url.searchParams.get('station');
		checked.push(id);
		if (id === 'nearest-good') await new Promise((resolve) => setTimeout(resolve, 10));
		if (url.searchParams.get('product') === 'water_level')
			return Response.json({ data: [{ t: stamp(id === 'stale' ? -90 : -6), v: '1.2' }] });
		if (url.searchParams.get('interval') === '6')
			return Response.json({
				predictions:
					id === 'partial'
						? [{ t: stamp(-10), v: '.5' }]
						: [
								{ t: stamp(-6), v: '.5' },
								{ t: stamp(6), v: '.7' }
							]
			});
		return Response.json({
			predictions: [
				{ t: stamp(-180), v: '.2', type: 'L' },
				{ t: stamp(180), v: '1.5', type: 'H' }
			]
		});
	};
	const result = await loadTides({ latitude: 41.88, longitude: -87.63 }, fetcher, {
		nearestUsable: true
	});
	assert.equal(result.station.station, 'nearest-good');
	assert.ok(result.station.distanceKm > 100);
	assert.ok(!checked.includes('lake'));
	assert.ok(!checked.includes('farther-good'));
	assert.ok(tideState(result.predictions, result.series, result.reading, Date.now()).observed);
});

test('demo selection skips provider errors and does not prefer the fastest response', async () => {
	const { loadTides } = await import('../apps/web/src/lib/server/forecast.ts');
	const stamp = (offset) =>
		new Date(Date.now() + offset * 60000).toISOString().slice(0, 16).replace('T', ' ');
	const result = await loadTides(
		{ latitude: 0, longitude: 0 },
		async (input) => {
			const url = new URL(input);
			if (url.pathname.includes('stations'))
				return Response.json({
					stations: [1, 2, 3].map((n) => ({
						id: String(n),
						name: String(n),
						lat: n,
						lng: 0,
						type: 'R',
						tidal: true
					}))
				});
			const id = url.searchParams.get('station');
			if (id === '1') return new Response('unavailable', { status: 503 });
			if (id === '2') await new Promise((resolve) => setTimeout(resolve, 10));
			if (url.searchParams.get('product') === 'water_level')
				return Response.json({ data: [{ t: stamp(-6), v: '1' }] });
			return Response.json({
				predictions: [
					{ t: stamp(-6), v: '.5', type: 'L' },
					{ t: stamp(6), v: '1.5', type: 'H' }
				]
			});
		},
		{ nearestUsable: true }
	);
	assert.equal(result.station.station, '2');
});

test('demo selection rejects stations when every reading is unavailable', async () => {
	const { loadTides } = await import('../apps/web/src/lib/server/forecast.ts');
	await assert.rejects(
		loadTides(
			{ latitude: 0, longitude: 0 },
			async (input) => {
				const url = new URL(input);
				if (url.pathname.includes('stations'))
					return Response.json({
						stations: [{ id: '1', name: 'Unavailable', lat: 1, lng: 0, type: 'R', tidal: true }]
					});
				return Response.json({ error: { message: 'No data' } });
			},
			{ nearestUsable: true }
		),
		/No station returned a fresh reading/
	);
});
