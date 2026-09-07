import type { TidePrediction, TideReading, TidePoint } from './types.js';

// Offset-free legacy NOAA values are station wall times; all new API data uses UTC.
export function tideTimestamp(time: string) {
	return Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(time) ? time : time.replace(' ', 'T') + 'Z');
}
export function tideState(
	predictions: TidePrediction[],
	series: TidePoint[],
	reading: TideReading | null,
	now: number
) {
	const events = predictions
		.filter((p) => Number.isFinite(tideTimestamp(p.time)) && Number.isFinite(Number(p.height)))
		.toSorted((a, b) => tideTimestamp(a.time) - tideTimestamp(b.time));
	const previous = events.filter((p) => tideTimestamp(p.time) <= now).at(-1);
	const next = events.find((p) => tideTimestamp(p.time) > now);
	const points = series
		.map((p) => ({ time: tideTimestamp(p.time), height: Number(p.height) }))
		.filter((p) => Number.isFinite(p.time) && Number.isFinite(p.height))
		.toSorted((a, b) => a.time - b.time);
	const before = points.filter((p) => p.time <= now).at(-1),
		after = points.find((p) => p.time >= now);
	const predicted =
		before && after
			? before.height +
				(after.height - before.height) *
					(after.time === before.time ? 0 : (now - before.time) / (after.time - before.time))
			: null;
	const observed =
		reading &&
		reading.height.trim() &&
		Number.isFinite(Number(reading.height)) &&
		now - tideTimestamp(reading.time) >= 0 &&
		now - tideTimestamp(reading.time) <= 30 * 60000
			? reading
			: null;
	return {
		events,
		previous,
		next,
		points,
		predicted,
		observed,
		level: observed ? Number(observed.height) : predicted
	};
}
