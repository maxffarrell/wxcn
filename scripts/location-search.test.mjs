import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchLocations } from '../apps/web/src/lib/server/location-search.ts';
test('place search supports city/state prefixes and returns real coordinates', () => {
	const austin = searchLocations('Austin TX').find((p) => p.label === 'Austin, TX');
	assert.ok(austin);
	assert.ok(Math.abs(austin.latitude - 30.2672) < 0.3);
	assert.ok(Math.abs(austin.longitude + 97.7431) < 0.3);
	assert.ok(searchLocations('new york ny').some((p) => p.label === 'New York, NY'));
	assert.deepEqual(searchLocations(''), []);
	assert.deepEqual(searchLocations('a'), []);
	assert.deepEqual(searchLocations('zzzzzzzzzz'), []);
	assert.ok(searchLocations('san').length <= 8);
});
