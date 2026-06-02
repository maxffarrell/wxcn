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
		application: 'wxcn-svelte',
		begin_date: begin,
		range: '48',
		datum: 'MLLW',
		station: location.station,
		time_zone: 'lst_ldt',
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
		time: prediction.t,
		height: prediction.v,
		type: prediction.type
	})) satisfies TidePrediction[];
}

export const sampleTides: TidePrediction[] = [
	{ time: '2026-06-01 02:12', height: '5.60', type: 'H' },
	{ time: '2026-06-01 08:28', height: '-0.30', type: 'L' },
	{ time: '2026-06-01 14:49', height: '4.90', type: 'H' },
	{ time: '2026-06-01 21:07', height: '-0.40', type: 'L' }
];
