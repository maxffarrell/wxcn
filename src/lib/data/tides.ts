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
	{ time: '2026-06-01 02:42', height: '4.81', type: 'H' },
	{ time: '2026-06-01 09:08', height: '0.42', type: 'L' },
	{ time: '2026-06-01 15:28', height: '5.16', type: 'H' },
	{ time: '2026-06-01 21:44', height: '0.31', type: 'L' }
];
