import { tideState } from '@wxcn/core/tide-state.js';
import { loadCurrentWeather } from './current-weather.ts';
import type { LocationInput, TidePrediction, WeatherPeriod } from '@wxcn/core/types.js';
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
	const hourlyRequest = (async (): Promise<WeatherPeriod[]> => {
		try {
			const url = new URL(data.properties.forecastHourly);
			if (url.origin !== 'https://api.weather.gov') return [];
			const response = await fetcher(url, { headers, signal: AbortSignal.timeout(12000) });
			if (!response.ok) return [];
			const hourly = await response.json();
			return Array.isArray(hourly.properties?.periods) ? hourly.properties.periods : [];
		} catch {
			return [];
		}
	})();
	const observationRequest = loadCurrentWeather(
		data.properties.observationStations,
		data.properties.timeZone ?? 'UTC',
		fetcher,
		headers
	);
	const endpoint = new URL(data.properties.forecast);
	if (endpoint.origin !== 'https://api.weather.gov')
		throw new Error('Invalid weather provider response.');
	const response = await fetcher(endpoint, { headers, signal: AbortSignal.timeout(12000) });
	if (!response.ok) throw new Error('The weather service is temporarily unavailable.');
	const forecast = await response.json();
	if (!Array.isArray(forecast.properties?.periods) || !forecast.properties.periods.length)
		throw new Error('No forecast periods were returned.');
	const relative = data.properties.relativeLocation?.properties;
	const currentWeather = await observationRequest;
	if (currentWeather) currentWeather.isDaytime = forecast.properties.periods[0].isDaytime;
	return {
		location: {
			...location,
			label: relative?.city ? `${relative.city}, ${relative.state}` : 'Your location',
			timeZone: data.properties.timeZone
		},
		forecast: forecast.properties.periods as WeatherPeriod[],
		currentWeather,
		hourlyForecast: await hourlyRequest,
		updatedAt: forecast.properties.updated ?? new Date().toISOString(),
		timeZone: data.properties.timeZone as string | undefined
	};
}
export type Station = {
	id: string;
	name: string;
	lat: number;
	lng: number;
	type?: string;
	reference_id?: string;
};
function rankedStations(location: LocationInput, stations: Station[], maxKm = Infinity) {
	const rad = (n: number) => (n * Math.PI) / 180;
	const distance = (s: Station) => {
		const dLat = rad(s.lat - location.latitude),
			dLon = rad(s.lng - location.longitude);
		const a =
			Math.sin(dLat / 2) ** 2 +
			Math.cos(rad(location.latitude)) * Math.cos(rad(s.lat)) * Math.sin(dLon / 2) ** 2;
		return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
	};
	return stations
		.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
		.map((s) => ({ ...s, distance: distance(s) }))
		.filter((s) => s.distance <= maxKm)
		.sort((a, b) => a.distance - b.distance);
}
export function nearestStation(location: LocationInput, stations: Station[], maxKm = 100) {
	return rankedStations(location, stations, maxKm)[0] ?? null;
}
// For high/low-only stations, NOAA identifies the harmonic reference used to
// produce their predictions. Use that related station only when it is nearby;
// otherwise preserve the local extrema instead of choosing an unrelated coast.
export function tideStation(location: LocationInput, stations: Station[]) {
	const valid = stations.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));
	const closest = nearestStation(location, valid);
	if (closest?.type !== 'S' || !closest.reference_id) return closest;
	return (
		nearestStation(
			location,
			valid.filter((s) => s.id === closest.reference_id && s.type === 'R')
		) ?? closest
	);
}
const stationCaches = new WeakMap<typeof fetch, { expires: number; stations: Station[] }>();
export async function loadTides(
	location: LocationInput,
	fetcher: typeof fetch = fetch,
	options: { nearestUsable?: boolean } = {}
) {
	const searchSignal = AbortSignal.timeout(22000);
	let stationsCache = stationCaches.get(fetcher);
	if (!stationsCache || stationsCache.expires < Date.now()) {
		const response = await fetcher(
			'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions',
			{ signal: AbortSignal.timeout(12000) }
		);
		if (!response.ok) throw new Error('The tide station service is unavailable.');
		const data = await response.json();
		if (!Array.isArray(data.stations)) throw new Error('No tide stations were returned.');
		stationsCache = { stations: data.stations, expires: Date.now() + 86400000 };
		stationCaches.set(fetcher, stationsCache);
	}
	if (options.nearestUsable) {
		const response = await fetcher(
			'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=waterlevels',
			{ signal: searchSignal }
		);
		if (!response.ok) throw new Error('The tide station service is unavailable.');
		const data = await response.json();
		if (!Array.isArray(data.stations)) throw new Error('No water-level stations were returned.');
		const active = new Set(
			data.stations
				.filter((s: { tidal?: boolean; greatlakes?: boolean }) => s.tidal === true && !s.greatlakes)
				.map((s: Station) => s.id)
		);
		const candidates = rankedStations(
			location,
			stationsCache.stations.filter((s) => s.type === 'R' && active.has(s.id))
		);
		// Probe in distance order. Wait for each batch so response speed cannot select
		// a farther station over a nearer station with complete, fresh data.
		for (let i = 0; i < candidates.length && !searchSignal.aborted; i += 3) {
			const results = await Promise.all(
				candidates.slice(i, i + 3).map(async (station) => {
					try {
						const result = await stationTides(location, station, fetcher, searchSignal);
						const state = tideState(result.predictions, result.series, result.reading, Date.now());
						return state.observed && state.predicted !== null && state.previous && state.next
							? result
							: null;
					} catch {
						return null;
					}
				})
			);
			const result = results.find((result) => result !== null);
			if (result) return result;
		}
		throw new Error(
			'No station returned a fresh reading and complete tide predictions. Please retry.'
		);
	}
	const station = tideStation(location, stationsCache.stations);
	if (!station) return { station: null, predictions: [], series: [], reading: null };

	return stationTides(location, station, fetcher, searchSignal);
}
async function stationTides(
	location: LocationInput,
	station: Station & { distance: number },
	fetcher: typeof fetch,
	searchSignal: AbortSignal
) {
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
			station: station.id,
			time_zone: 'gmt',
			units: 'english',
			format: 'json',
			...extra
		}).toString();
		const response = await fetcher(url, {
			signal: AbortSignal.any([searchSignal, AbortSignal.timeout(4000)])
		});
		if (!response.ok) throw new Error('Tide data is temporarily unavailable.');
		return response.json();
	}
	const [extrema, continuous, observed] = await Promise.all([
		request({ product: 'predictions', begin_date: begin, range: '72', interval: 'hilo' }).catch(
			() => null
		),
		request({ product: 'predictions', begin_date: begin, range: '72', interval: '6' }).catch(
			() => null
		),
		request({ product: 'water_level', date: 'latest' }).catch(() => null)
	]);

	const point = (p: { t: string; v: string }) => ({
		time: p.t.replace(' ', 'T') + 'Z',
		height: p.v
	});
	const validPoint = (p: { t?: unknown; v?: unknown }) =>
		typeof p?.t === 'string' &&
		Number.isFinite(Date.parse(p.t.replace(' ', 'T') + 'Z')) &&
		typeof p.v === 'string' &&
		p.v.trim() !== '' &&
		Number.isFinite(Number(p.v));
	const predictions = Array.isArray(extrema?.predictions)
		? extrema.predictions.filter(
				(p: { t: string; v: string; type: string }) =>
					validPoint(p) && (p.type === 'H' || p.type === 'L')
			)
		: [];
	const series = Array.isArray(continuous?.predictions)
		? continuous.predictions.filter(validPoint).map(point)
		: [];
	if (!predictions.length && !series.length)
		throw new Error('Tide predictions are temporarily unavailable at the nearby station.');
	const latest = (Array.isArray(observed?.data) ? observed.data : []).filter(validPoint).at(-1);
	return {
		station: {
			label: station.name,
			latitude: station.lat,
			longitude: station.lng,
			station: station.id,
			distanceKm: Math.round(station.distance),
			timeZone: location.timeZone ?? 'UTC'
		},
		predictions: predictions.map((p: { t: string; v: string; type: 'H' | 'L' }) => ({
			...point(p),
			type: p.type
		})) as TidePrediction[],
		series,
		reading: latest ? point(latest) : null
	};
}
