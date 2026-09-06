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
		'User-Agent': 'wxcn (https://github.com/maxffarrell/wxcn-svelte)'
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
export async function loadTides(
	location: LocationInput,
	fetcher: typeof fetch = fetch,
	useNearest = false
) {
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
	const station = nearestStation(location, stationsCache.stations, useNearest ? Infinity : 100);
	if (!station) return { station: null, predictions: [] };

	const date = new Date();
	const begin = new Date(date.getTime() - 24 * 3600000)
		.toISOString()
		.slice(0, 16)
		.replace('T', ' ')
		.replaceAll('-', '');
	async function request(extra: Record<string, string>) {
		const url = new URL('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter');
		url.search = new URLSearchParams({
			application: 'wxcn',
			datum: 'MLLW',
			station: station!.id,
			time_zone: 'gmt',
			units: 'english',
			format: 'json',
			...extra
		}).toString();
		const response = await fetcher(url, { signal: AbortSignal.timeout(12000) });
		if (!response.ok) throw new Error('Tide data is temporarily unavailable.');
		return response.json();
	}
	const [extrema, continuous, observed] = await Promise.all([
		request({ product: 'predictions', begin_date: begin, range: '72', interval: 'hilo' }),
		request({ product: 'predictions', begin_date: begin, range: '72', interval: '6' }).catch(
			() => null
		),
		request({ product: 'water_level', date: 'latest' }).catch(() => null)
	]);
	if (!Array.isArray(extrema.predictions))
		throw new Error('This station has no high/low predictions available.');
	const point = (p: { t: string; v: string }) => ({
		time: p.t.replace(' ', 'T') + 'Z',
		height: p.v
	});
	const latest = observed?.data
		?.filter((p: { v: string }) => p.v.trim() && Number.isFinite(Number(p.v)))
		.at(-1);
	return {
		station: {
			label: station.name,
			latitude: station.lat,
			longitude: station.lng,
			station: station.id,
			distanceKm: Math.round(station.distance),
			timeZone: location.timeZone ?? 'UTC'
		},
		predictions: extrema.predictions.map((p: { t: string; v: string; type: 'H' | 'L' }) => ({
			...point(p),
			type: p.type
		})) as TidePrediction[],
		series: Array.isArray(continuous?.predictions) ? continuous.predictions.map(point) : [],
		reading: latest ? point(latest) : null
	};
}
