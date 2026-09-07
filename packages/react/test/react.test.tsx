import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { MoonDisc } from '../src/components/wxcn/moon-disc';
import { MoonForecast } from '../src/components/wxcn/moon-forecast';
import { TideForecast } from '../src/components/wxcn/tide-forecast';
import { WeatherForecast } from '../src/components/wxcn/weather-forecast';
import { sampleCurrentWeather, sampleWeather } from '../../core/src/weather';
import type { TidePrediction } from '../../core/src/types';

test('weather, tide, and moon render during SSR without browser globals', () => {
	assert.equal('window' in globalThis, false);
	assert.doesNotThrow(() => {
		renderToString(
			<>
				<WeatherForecast />
				<TideForecast />
				<MoonForecast />
			</>
		);
	});
});

test('moon discs use unique hydration-safe gradient IDs', () => {
	const html = renderToString(
		<>
			<MoonDisc phase={0.25} />
			<MoonDisc phase={0.75} />
		</>
	);
	const ids = [...html.matchAll(/id="([^"]+-surface)"/g)].map((match) => match[1]);
	assert.equal(ids.length, 2);
	assert.notEqual(ids[0], ids[1]);
	assert.match(html, new RegExp(`url\\(#${ids[0]}\\)`));
	assert.match(html, new RegExp(`url\\(#${ids[1]}\\)`));
	assert.ok(ids.every((id) => !id.includes(':')));
});

test('empty weather data reports unavailable current conditions', () => {
	const html = renderToString(
		<WeatherForecast type="simple" forecast={[]} currentWeather={null} sourceLabel="" />
	);
	assert.match(html, /Current conditions unavailable\./);
	assert.doesNotMatch(html, /undefined|null/);
});

test('weather temperature conversion respects Celsius and Fahrenheit output units', () => {
	const celsius = renderToString(
		<WeatherForecast
			type="simple"
			unit="celsius"
			forecast={sampleWeather}
			currentWeather={sampleCurrentWeather}
			sourceLabel=""
		/>
	);
	assert.match(celsius, />30<span[^>]*>°<\/span>/);

	const fahrenheitWeather = { ...sampleCurrentWeather, temperature: 20, temperatureUnit: 'C' };
	const fahrenheit = renderToString(
		<WeatherForecast
			type="simple"
			unit="fahrenheit"
			forecast={sampleWeather}
			currentWeather={fahrenheitWeather}
			sourceLabel=""
		/>
	);
	assert.match(fahrenheit, />68<span[^>]*>°<\/span>/);
});

test('stale tide observations never become current water levels', () => {
	const predictions: TidePrediction[] = [
		{ time: '2026-09-06T18:00:00Z', height: '1.2', type: 'H' },
		{ time: '2026-09-06T23:00:00Z', height: '0.4', type: 'L' }
	];
	const html = renderToString(
		<TideForecast
			at={Date.parse('2026-09-06T16:00:00Z')}
			predictions={predictions}
			series={[]}
			reading={{ time: '2026-09-06T14:00:00Z', height: '9.9' }}
			example={false}
			sourceLabel=""
		/>
	);
	assert.doesNotMatch(html, /Current water level/);
	assert.match(html, /High\/low predictions only/);
	assert.doesNotMatch(html, />9\.9\s*ft/);
});

test('tide predictions-only and missing data stay semantically distinct', () => {
	const predictionsOnly = renderToString(
		<TideForecast
			type="simple"
			at={Date.parse('2026-09-06T16:00:00Z')}
			predictions={[
				{ time: '2026-09-06T18:00:00Z', height: '1.2', type: 'H' },
				{ time: '2026-09-06T23:00:00Z', height: '0.4', type: 'L' }
			]}
			series={[]}
			example={false}
			sourceLabel=""
		/>
	);
	assert.match(predictionsOnly, /High\/low predictions only/);
	assert.doesNotMatch(predictionsOnly, /Current water level/);

	const missing = renderToString(
		<TideForecast predictions={[]} series={[]} example={false} sourceLabel="" />
	);
	assert.match(missing, /No tide predictions available\./);
	assert.doesNotMatch(missing, /Current water level|Predicted water level/);
});

test('live data without an explicit time uses deterministic SSR loading states', () => {
	const weather = renderToString(
		<WeatherForecast forecast={[...sampleWeather]} currentWeather={sampleCurrentWeather} />
	);
	const tides = renderToString(
		<TideForecast
			example={false}
			predictions={[{ time: '2026-09-06T18:00:00Z', height: '1.2', type: 'H' }]}
		/>
	);
	assert.match(weather, /Loading current weather time/);
	assert.match(tides, /Loading current tide time/);
});
