import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weatherOutlook } from '../packages/core/src/weather-outlook.ts';
import { sampleWeather, sampleCurrentWeather } from '../packages/core/src/weather.ts';
import { loadForecast } from '../apps/web/src/lib/server/forecast.ts';
import { currentWeatherFromObservations } from '../apps/web/src/lib/server/current-weather.ts';
const at = Date.parse(sampleCurrentWeather.observedAt);
const outlook = (changes = {}, unit = 'fahrenheit', forecast = sampleWeather) =>
	weatherOutlook({ ...sampleCurrentWeather, ...changes }, forecast, unit, 'America/Chicago', at);
test('current temperature stays distinct from today high and tonight low', () => {
	assert.equal(sampleCurrentWeather.temperature, 86);
	assert.deepEqual(outlook(), {
		high: 92,
		low: 74,
		trend: 'Going up to 92° today',
		highReached: false
	});
	assert.equal(outlook({}, 'celsius').trend, 'Going up to 33° today');
	assert.equal(outlook({ isDaytime: false }).trend, 'Going down to 74° tonight');
});
test('after the observed high is reached, do not claim temperatures will rise again', () => {
	assert.equal(outlook({ temperature: 86, highToday: 94 }).trend, 'Going down to 74° tonight');
	assert.equal(outlook({ temperature: 92, highToday: 92 }).highReached, true);
	assert.equal(outlook({ temperature: 70, highToday: 94, isDaytime: false }).trend, null);
	assert.equal(outlook({}, 'fahrenheit', sampleWeather.slice(2)).trend, null);
	assert.equal(
		weatherOutlook(null, sampleWeather, 'fahrenheit', 'America/Chicago', at).trend,
		null
	);
});
test('station history rejects missing/stale observations and only counts local-day extrema', () => {
	const observation = (timestamp, value) => ({
		timestamp,
		temperature: { value, unitCode: 'wmoUnit:degC' },
		textDescription: 'Clear'
	});
	const result = currentWeatherFromObservations(
		[
			observation('2026-09-06T20:55:00Z', 30),
			observation('2026-09-06T18:00:00Z', 35),
			observation('2026-09-06T03:00:00Z', 40), // previous calendar day in Austin
			observation('2026-09-06T20:58:00Z', null)
		],
		'America/Chicago',
		at
	);
	assert.equal(result.temperature, 30);
	assert.equal(result.highToday, 35);
	assert.equal(result.windSpeed, 'Unavailable');
	assert.equal(
		currentWeatherFromObservations(
			[observation('2026-09-06T18:00:00Z', 30)],
			'America/Chicago',
			at
		),
		null
	);
});

test('weather endpoint keeps observations separate and preserves forecasts when stations fail', async () => {
	let unavailable = false;
	const fetcher = async (input) => {
		const url = new URL(input);
		if (url.pathname.startsWith('/points/'))
			return Response.json({
				properties: {
					forecast: 'https://api.weather.gov/forecast',
					observationStations: 'https://api.weather.gov/stations',
					timeZone: 'America/Chicago'
				}
			});
		if (url.pathname === '/forecast')
			return Response.json({ properties: { periods: sampleWeather } });
		if (unavailable) return new Response('', { status: 503 });
		if (url.pathname === '/stations')
			return Response.json({ features: [{ id: 'https://api.weather.gov/stations/KAUS' }] });
		assert.equal(url.pathname, '/stations/KAUS/observations');
		return Response.json({
			features: [
				{
					properties: {
						timestamp: new Date().toISOString(),
						temperature: { value: 30, unitCode: 'wmoUnit:degC' },
						textDescription: 'Clear'
					}
				}
			]
		});
	};
	const result = await loadForecast({ latitude: 30.2672, longitude: -97.7431 }, fetcher);
	assert.equal(result.currentWeather.temperature, 30);
	assert.equal(result.currentWeather.isDaytime, true);
	assert.equal(result.forecast[0].temperature, 92);
	unavailable = true;
	const fallback = await loadForecast({ latitude: 30.2672, longitude: -97.7431 }, fetcher);
	assert.equal(fallback.currentWeather, null);
	assert.deepEqual(fallback.forecast, sampleWeather);
});
