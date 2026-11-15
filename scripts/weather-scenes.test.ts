import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weatherScenes as scenes } from '../packages/svelte/src/components/wxcn/weather-scenes.ts';

test('weather families select appropriate clouds and precipitation intensity', () => {
	assert.equal(scenes.cloudy.plate, 'overcast');
	assert.equal(scenes.thunderstorm.plate, 'storm');
	assert.equal(scenes.fog.plate, 'fog');
	assert.ok(scenes.drizzle.rain < scenes.rain.rain);
	assert.ok(scenes.rain.rain < scenes['heavy-rain'].rain);
	assert.ok(scenes.snow.snow < scenes['heavy-snow'].snow);
	assert.ok(scenes['wintry-mix'].rain > 0 && scenes['wintry-mix'].snow > 0);
	assert.ok(scenes.fog.mist > scenes.haze.mist);
	assert.ok(scenes.wind.wind > scenes['partly-cloudy'].wind);
	assert.ok(scenes.clear.coverage < scenes['partly-cloudy'].coverage);
	for (const mode of ['clear', 'partly-cloudy', 'drizzle']) {
		assert.deepEqual(scenes[`${mode}-night`], scenes[mode]);
	}
});

import { readFile } from 'node:fs/promises';
test('native sky ports preserve the canonical shader, scene data, and embedded photography', async () => {
	const source = async (framework, file) =>
		readFile(
			new URL(`../packages/${framework}/src/components/wxcn/${file}`, import.meta.url),
			'utf8'
		);
	const shader = (code) =>
		code.slice(code.indexOf('precision highp'), code.indexOf('`', code.indexOf('precision highp')));
	const canonical = shader(await source('svelte', 'WeatherShaderBackground.svelte'));
	for (const framework of ['react', 'vue']) {
		assert.equal(
			shader(
				await source(
					framework,
					framework === 'react' ? 'weather-shader-background.tsx' : 'WeatherShaderBackground.vue'
				)
			),
			canonical,
			`${framework} shader`
		);
		for (const file of ['cloud-texture.ts', 'weather-scenes.ts'])
			assert.equal(
				await source(framework, file),
				await source('svelte', file),
				`${framework} ${file}`
			);
	}
});
