import { getMoonForecast } from '../packages/core/src/moon.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSkyState, getSkyPreviewTime } from '../packages/core/src/sky.ts';
const austin = [30.2672, -97.7431];
const sky = (instant, location = austin) => getSkyState(...location, Date.parse(instant));

test('Austin sky follows sunrise, solar noon, sunset and night rather than forecast labels', () => {
	const dawn = sky('2026-09-07T07:12:00-05:00');
	const noon = sky('2026-09-07T13:29:00-05:00');
	const dusk = sky('2026-09-07T19:45:00-05:00');
	const night = sky('2026-09-07T23:00:00-05:00');
	assert.equal(dawn.period, 'sunrise');
	assert.equal(noon.period, 'midday');
	assert.equal(dusk.period, 'sunset');
	assert.equal(night.period, 'night');
	assert.ok(dawn.sun.azimuth > 70 && dawn.sun.azimuth < 100);
	assert.ok(Math.abs(noon.sun.azimuth - 180) < 2);
	assert.ok(noon.sun.altitude > 60);
	assert.ok(dusk.sun.azimuth > 260 && dusk.sun.azimuth < 290);
	assert.equal(night.sun.visible, false);
	assert.equal(sky('2026-09-07T18:19:00-05:00').isDaytime, true);
});
test('eclipse dates agree with new/full lunar phases and horizon visibility', () => {
	// NASA 2024 eclipse catalog: April 8 solar eclipse and March 25 lunar eclipse.
	const eclipse = sky('2024-04-08T18:18:00Z');
	assert.ok(eclipse.moon.illumination < 0.001);
	assert.equal(eclipse.moon.phaseName, 'New Moon');
	assert.ok(Math.abs(eclipse.sun.azimuth - eclipse.moon.azimuth) < 1);
	assert.ok(Math.abs(eclipse.sun.altitude - eclipse.moon.altitude) < 1);
	assert.ok(sky('2024-03-25T07:12:00Z').moon.illumination > 0.999);
	assert.equal(sky('2026-09-08T01:29:00-05:00').moon.visible, false);
	assert.equal(sky('2026-09-07T13:29:00-05:00').moon.visible, true); // Daytime moon.
});
test('lunar terminator tracks illumination and observer-relative tilt', () => {
	const north = sky('2026-09-07T12:00:00Z');
	const south = sky('2026-09-07T12:00:00Z', [-33.87, 151.21]);
	for (const state of [north, south]) {
		assert.ok(Math.abs(Math.hypot(...state.moon.light) - 1) < 1e-9);
		assert.ok(Math.abs(state.moon.light[2] - (2 * state.moon.illumination - 1)) < 1e-9);
	}
	assert.notDeepEqual(north.moon.light.slice(0, 2), south.moon.light.slice(0, 2));
});
test('polar conditions, invalid coordinates, and equivalent timezone instants stay consistent', () => {
	assert.equal(sky('2026-06-21T00:00:00Z', [78.22, 15.65]).sun.visible, true);
	assert.equal(sky('2026-12-21T12:00:00Z', [78.22, 15.65]).sun.visible, false);
	assert.equal(getSkyPreviewTime(78.22, 15.65, Date.parse('2026-06-21T12:00:00Z'), 'sunset'), null);
	assert.deepEqual(sky('2026-09-07T18:19:00-05:00'), sky('2026-09-07T23:19:00Z'));
	assert.equal(getSkyState(NaN, 0), null);
	assert.equal(getSkyState(91, 0), null);
	assert.equal(getSkyState(0, 181), null);
	assert.equal(getSkyState(0, 0, NaN), null);
});
test('time previews find real astronomical events and advance positions over time', () => {
	const at = Date.parse('2026-09-07T18:19:00-05:00');
	for (const period of ['sunrise', 'midday', 'sunset', 'night']) {
		const instant = getSkyPreviewTime(...austin, at, period);
		assert.notEqual(instant, null);
		assert.equal(getSkyState(...austin, instant).period, period);
	}
	assert.notEqual(
		getSkyState(...austin, at).sun.azimuth,
		getSkyState(...austin, at + 60000).sun.azimuth
	);
});

test('the moon card and weather sky agree on lunar phase and illumination', () => {
	const date = new Date('2026-09-07T12:00:00Z');
	const state = sky(date.toISOString());
	const forecast = getMoonForecast(date);
	assert.equal(forecast.phase, state.moon.phase);
	assert.equal(forecast.phaseName, state.moon.phaseName);
	assert.equal(forecast.illumination, Math.round(state.moon.illumination * 100));
	assert.ok(Date.parse(forecast.nextFullMoon) > date.getTime());
	assert.ok(Date.parse(forecast.nextNewMoon) > date.getTime());
});
