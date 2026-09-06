import { test } from 'node:test';
import assert from 'node:assert/strict';
import { presetOptions, encodePreset, decodePreset } from '../src/lib/preset.ts';
import { convertWindSpeed } from '../src/lib/data/weather.ts';
test('wxcn presets round-trip all settings, including units and scenes', () => {
	for (let n = 0; n < 6; n++) {
		const config = Object.fromEntries(
			Object.entries(presetOptions).map(([key, values]) => [key, values[n % values.length]])
		);
		assert.deepEqual(decodePreset('--preset ' + encodePreset(config)), config);
	}
	for (const invalid of ['', 'wx1.', 'wx1.zzzzzzzzzzzzzz', 'other.00000000000000'])
		assert.equal(decodePreset(invalid), null);
});
test('optional wind units convert the full speed range and preserve calm conditions', () => {
	assert.equal(convertWindSpeed('5 to 10 mph', 'km/h'), '8 to 16 km/h');
	assert.equal(convertWindSpeed('10 m/s', 'mph'), '22 mph');
	assert.equal(convertWindSpeed('Calm', 'knots'), 'Calm');
});
