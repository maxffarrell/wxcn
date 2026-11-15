import { isDaylight } from '../apps/web/src/lib/server/daylight.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weatherOutlook, weatherDayHigh } from '../packages/core/src/weather-outlook.ts';
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
					forecastHourly: 'https://api.weather.gov/hourly',
					observationStations: 'https://api.weather.gov/stations',
					timeZone: 'America/Chicago'
				}
			});
		if (url.pathname === '/forecast')
			return Response.json({
				properties: {
					periods: [{ ...sampleWeather[0], isDaytime: false }, ...sampleWeather.slice(1)]
				}
			});
		if (unavailable) return new Response('', { status: 503 });
		if (url.pathname === '/hourly')
			return Response.json({ properties: { periods: [sampleWeather[0]] } });
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
	const result = await loadForecast({ latitude: 30.2672, longitude: -97.7431 }, fetcher, at);
	assert.deepEqual(result.hourlyForecast, [sampleWeather[0]]);
	assert.equal(result.currentWeather.temperature, 30);
	assert.equal(result.currentWeather.isDaytime, true);
	assert.equal(result.forecast[0].temperature, 92);
	unavailable = true;
	const fallback = await loadForecast({ latitude: 30.2672, longitude: -97.7431 }, fetcher);
	assert.deepEqual(fallback.hourlyForecast, []);
	assert.equal(fallback.currentWeather, null);
	assert.deepEqual(fallback.forecast, [
		{ ...sampleWeather[0], isDaytime: false },
		...sampleWeather.slice(1)
	]);
});

test('Austin remains daytime at 6:19pm, and becomes night after sunset', () => {
	assert.equal(isDaylight(30.2672, -97.7431, Date.parse('2026-09-07T18:19:00-05:00')), true);
	assert.equal(isDaylight(30.2672, -97.7431, Date.parse('2026-09-07T21:00:00-05:00')), false);
	assert.equal(isDaylight(30.2672, -97.7431, Date.parse('2026-12-07T18:19:00-06:00')), false);
});
test('solar daylight handles longitude, UTC date boundaries, and polar seasons', () => {
	assert.equal(isDaylight(-33.87, 151.21, Date.parse('2026-09-08T12:00:00+10:00')), true);
	assert.equal(isDaylight(-33.87, 151.21, Date.parse('2026-09-08T00:00:00+10:00')), false);
	assert.equal(isDaylight(78.22, 15.65, Date.parse('2026-06-21T00:00:00Z')), true);
	assert.equal(isDaylight(78.22, 15.65, Date.parse('2026-12-21T12:00:00Z')), false);
});

test('week high survives sunset without borrowing observations from another local day', () => {
	const observed = { ...sampleCurrentWeather, observedAt: '2026-09-07T01:00:00Z', highToday: 99 };
	assert.equal(
		weatherDayHigh('2026-09-06', [sampleWeather[1]], observed, 'fahrenheit', 'America/Chicago'),
		99
	);
	assert.equal(
		weatherDayHigh('2026-09-06', [sampleWeather[0]], observed, 'fahrenheit', 'America/Chicago'),
		99
	);
	assert.equal(weatherDayHigh('2026-09-06', [], observed, 'celsius', 'America/Chicago'), 37);
	assert.equal(weatherDayHigh('2026-09-07', [], observed, 'fahrenheit', 'America/Chicago'), null);
	assert.equal(weatherDayHigh('2026-09-06', [], null, 'fahrenheit', 'America/Chicago'), null);
});
