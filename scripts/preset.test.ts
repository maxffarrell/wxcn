import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	encodePreset,
	decodePreset,
	generateRandomConfig,
	DEFAULT_PRESET_CONFIG
} from '../apps/web/src/lib/preset.ts';
import * as upstream from 'shadcn-svelte/preset';
import { convertWindSpeed } from '../packages/core/src/weather.ts';
test('presets use the upstream encoder and preserve every native setting', () => {
	assert.equal(encodePreset, upstream.encodePreset);
	assert.equal(decodePreset, upstream.decodePreset);
	assert.equal(encodePreset(DEFAULT_PRESET_CONFIG), 'b0');
	for (let i = 0; i < 100; i++) {
		const config = generateRandomConfig();
		const code = upstream.encodePreset(config);
		assert.deepEqual(decodePreset(code), upstream.decodePreset(code));
		assert.equal(encodePreset(decodePreset(code)), code);
	}
	assert.equal(decodePreset('wx1.00000000000000'), null);
});
test('optional wind units convert the full speed range and preserve calm conditions', () => {
	assert.equal(convertWindSpeed('5 to 10 mph', 'km/h'), '8 to 16 km/h');
	assert.equal(convertWindSpeed('10 m/s', 'mph'), '22 mph');
	assert.equal(convertWindSpeed('Calm', 'knots'), 'Calm');
});
