import type { LocationInput, TidePrediction } from './types.js';

type NoaaPrediction = {
	t: string;
	v: string;
	type: 'H' | 'L';
};

type NoaaResponse = {
	predictions: NoaaPrediction[];
};

export async function fetchTidePredictions(location: LocationInput, date = new Date()) {
	if (!location.station) {
		throw new Error('NOAA tide predictions require a CO-OPS station id.');
	}

	const begin = date.toISOString().slice(0, 10).replaceAll('-', '');
	const url = new URL('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter');
	url.search = new URLSearchParams({
		product: 'predictions',
		application: 'wxcn',
		begin_date: begin,
		range: '48',
		datum: 'MLLW',
		station: location.station,
		time_zone: 'gmt',
		units: 'english',
		interval: 'hilo',
		format: 'json'
	}).toString();

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`NOAA tide lookup failed with ${response.status}`);
	}

	const data = (await response.json()) as NoaaResponse;
	return data.predictions.map((prediction) => ({
		time: prediction.t.replace(' ', 'T') + 'Z',
		height: prediction.v,
		type: prediction.type
	})) satisfies TidePrediction[];
}

export const sampleTides: TidePrediction[] = [
	{ time: '2026-09-06T02:12:00-05:00', height: '1.8', type: 'H' },
	{ time: '2026-09-06T08:28:00-05:00', height: '0.4', type: 'L' },
	{ time: '2026-09-06T14:49:00-05:00', height: '1.5', type: 'H' },
	{ time: '2026-09-06T21:07:00-05:00', height: '0.3', type: 'L' }
];

export const sampleTideTime = Date.parse('2026-09-06T16:30:00Z');
// Illustrative six-minute samples, used only by the labeled coastal example.
export const sampleTideSeries = Array.from({ length: 241 }, (_, i) => {
	const time = Date.parse('2026-09-06T05:00:00Z') + i * 360000;
	return {
		time: new Date(time).toISOString(),
		height: (
			0.95 +
			0.65 *
				Math.cos(((time - Date.parse('2026-09-06T07:12:00Z')) / (12.6 * 3600000)) * 2 * Math.PI)
		).toFixed(3)
	};
});
