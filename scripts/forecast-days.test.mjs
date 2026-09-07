import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forecastDays } from '../packages/core/src/forecast-days.ts';
const entry = (time) => ({
	time: Date.parse(time),
	label: 'Period',
	summary: 'Clear',
	details: 'Light wind'
});
test('groups day and night in the location calendar and sorts supplied periods', () => {
	const night = entry('2026-09-08T02:00:00Z');
	const morning = entry('2026-09-07T13:00:00Z');
	const days = forecastDays([night, morning], 'America/Chicago');
	assert.equal(days.length, 1);
	assert.deepEqual(days[0].entries, [morning, night]);
	assert.equal(forecastDays([night, morning], 'UTC').length, 2);
});
test('handles empty and invalid data and caps output without filling missing days', () => {
	assert.deepEqual(forecastDays([], 'UTC'), []);
	assert.deepEqual(forecastDays([entry('invalid')], 'UTC'), []);
	const days = Array.from({ length: 9 }, (_, i) =>
		entry(`2026-09-${String(i + 10).padStart(2, '0')}T12:00:00Z`)
	);
	assert.equal(forecastDays(days, 'UTC').length, 7);
	assert.equal(forecastDays([days[0], days[3]], 'UTC').length, 2);
});
test('DST fall-back hours remain in the same local calendar day', () => {
	assert.equal(
		forecastDays(
			[entry('2026-11-01T01:30:00-05:00'), entry('2026-11-01T01:30:00-06:00')],
			'America/Chicago'
		).length,
		1
	);
});
