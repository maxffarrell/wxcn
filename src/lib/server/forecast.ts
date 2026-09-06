import type { LocationInput, TidePrediction, WeatherPeriod } from '../data/types.js';
export function coordinates(url: URL) {
	const lat = url.searchParams.get('latitude'),
		lon = url.searchParams.get('longitude');
	if (lat === null || lon === null || !lat.trim() || !lon.trim())
		throw new Error('Missing location coordinates.');
	const latitude = Number(lat),
		longitude = Number(lon);
	if (
		!Number.isFinite(latitude) ||
		!Number.isFinite(longitude) ||
		Math.abs(latitude) > 90 ||
		Math.abs(longitude) > 180
	)
		throw new Error('Invalid location coordinates.');
	return { latitude, longitude };
}
export async function loadForecast(location: LocationInput, fetcher: typeof fetch = fetch) {
	const headers = {
		Accept: 'application/geo+json',
		'User-Agent': 'wxcn-svelte (https://github.com/maxffarrell/wxcn-svelte)'
	};
	const point = await fetcher(
		`https://api.weather.gov/points/${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`,
		{ headers, signal: AbortSignal.timeout(12000) }
	);
	if (!point.ok)
		throw new Error('Weather is unavailable here. NWS forecasts cover the United States.');
	const data = await point.json();
	const endpoint = new URL(data.properties.forecast);
	if (endpoint.origin !== 'https://api.weather.gov')
		throw new Error('Invalid weather provider response.');
	const response = await fetcher(endpoint, { headers, signal: AbortSignal.timeout(12000) });
	if (!response.ok) throw new Error('The weather service is temporarily unavailable.');
	const forecast = await response.json();
	if (!Array.isArray(forecast.properties?.periods) || !forecast.properties.periods.length)
		throw new Error('No forecast periods were returned.');
	const relative = data.properties.relativeLocation?.properties;
	return {
		location: {
			...location,
			label: relative?.city ? `${relative.city}, ${relative.state}` : 'Your location',
			timeZone: data.properties.timeZone
		},
		forecast: forecast.properties.periods as WeatherPeriod[],
		updatedAt: forecast.properties.updated ?? new Date().toISOString(),
		timeZone: data.properties.timeZone as string | undefined
	};
}
export type Station = { id: string; name: string; lat: number; lng: number };
export function nearestStation(location: LocationInput, stations: Station[], maxKm = 100) {
	const rad = (n: number) => (n * Math.PI) / 180;
	const distance = (s: Station) => {
		const dLat = rad(s.lat - location.latitude),
			dLon = rad(s.lng - location.longitude);
		const a =
			Math.sin(dLat / 2) ** 2 +
			Math.cos(rad(location.latitude)) * Math.cos(rad(s.lat)) * Math.sin(dLon / 2) ** 2;
		return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
	};
	return (
		stations
			.map((s) => ({ ...s, distance: distance(s) }))
			.filter((s) => s.distance <= maxKm)
			.sort((a, b) => a.distance - b.distance)[0] ?? null
	);
}
let stationsCache: { expires: number; stations: Station[] } | undefined;
export async function loadTides(location: LocationInput, fetcher: typeof fetch = fetch) {
	if (!stationsCache || stationsCache.expires < Date.now()) {
		const response = await fetcher(
			'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions',
			{ signal: AbortSignal.timeout(12000) }
		);
		if (!response.ok) throw new Error('The tide station service is unavailable.');
		const data = await response.json();
		if (!Array.isArray(data.stations)) throw new Error('No tide stations were returned.');
		stationsCache = { stations: data.stations, expires: Date.now() + 86400000 };
	}
	const station = nearestStation(location, stationsCache.stations);
	if (!station) return { station: null, predictions: [] };
	const url = new URL('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter');
	url.search = new URLSearchParams({
		product: 'predictions',
		application: 'wxcn-svelte',
		date: 'today',
		range: '72',
		datum: 'MLLW',
		station: station.id,
		time_zone: 'lst_ldt',
		units: 'english',
		interval: 'hilo',
		format: 'json'
	}).toString();
	const response = await fetcher(url, { signal: AbortSignal.timeout(12000) });
	if (!response.ok) throw new Error('Tide predictions are temporarily unavailable.');
	const data = await response.json();
	if (!Array.isArray(data.predictions))
		throw new Error('This station has no high/low predictions available.');
	return {
		station: {
			label: station.name,
			latitude: station.lat,
			longitude: station.lng,
			station: station.id
		},
		predictions: data.predictions.map((p: { t: string; v: string; type: 'H' | 'L' }) => ({
			time: p.t,
			height: p.v,
			type: p.type
		})) as TidePrediction[]
	};
}
