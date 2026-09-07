import type { CurrentWeather } from '@wxcn/core/types.js';
type Observation = {
	timestamp: string;
	temperature: { value: number | null; unitCode: string };
	textDescription?: string;
	windSpeed?: { value: number | null; unitCode: string };
	windDirection?: { value: number | null };
};
export function currentWeatherFromObservations(
	observations: Observation[],
	timeZone = 'UTC',
	at = Date.now()
): CurrentWeather | null {
	const celsius = (p: Observation) =>
		p.temperature.unitCode.endsWith('degF')
			? ((p.temperature.value! - 32) * 5) / 9
			: p.temperature.value!;
	const valid = observations
		.filter(
			(p) =>
				p.temperature?.value !== null &&
				Number.isFinite(p.temperature?.value) &&
				/deg[CF]$/.test(p.temperature.unitCode) &&
				Number.isFinite(Date.parse(p.timestamp)) &&
				Date.parse(p.timestamp) <= at &&
				Date.parse(p.timestamp) >= at - 26 * 3600000
		)
		.toSorted((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
	const latest = valid[0];
	if (!latest || at - Date.parse(latest.timestamp) > 2 * 3600000) return null;
	const day = (v: number | string) =>
		new Intl.DateTimeFormat('en-CA', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).format(new Date(v));
	const today = valid.filter((p) => day(p.timestamp) === day(at)).map(celsius);
	const wind = latest.windSpeed;
	const speed = wind?.value;
	const direction = latest.windDirection?.value;
	return {
		name: 'Now',
		startTime: latest.timestamp,
		observedAt: latest.timestamp,
		temperature: celsius(latest),
		temperatureUnit: 'C',
		highToday: today.length ? Math.max(...today) : undefined,
		lowToday: today.length ? Math.min(...today) : undefined,
		shortForecast: latest.textDescription || 'Current conditions',
		detailedForecast: latest.textDescription || '',
		isDaytime: false,
		windSpeed:
			speed == null
				? 'Unavailable'
				: `${Math.round(speed)} ${wind?.unitCode.endsWith('km_h-1') ? 'km/h' : wind?.unitCode.endsWith('mi_h-1') ? 'mph' : 'm/s'}`,
		windDirection:
			direction == null
				? ''
				: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(direction / 45) % 8]
	};
}
export async function loadCurrentWeather(
	stationsUrl: string | undefined,
	timeZone: string,
	fetcher: typeof fetch,
	headers: Record<string, string>
): Promise<CurrentWeather | null> {
	if (!stationsUrl) return null;
	const get = async (value: string) => {
		const url = new URL(value);
		if (url.origin !== 'https://api.weather.gov') throw new Error('Invalid observation provider');
		const response = await fetcher(url, { headers, signal: AbortSignal.timeout(6000) });
		if (!response.ok) throw new Error('Observation unavailable');
		return response.json();
	};
	try {
		const stations = await get(stationsUrl);
		const stationUrls: string[] = (stations.features ?? [])
			.slice(0, 3)
			.map(
				(s: { id?: string; properties?: { stationIdentifier?: string } }) =>
					s.id ?? `https://api.weather.gov/stations/${s.properties?.stationIdentifier}`
			);
		const observations = await Promise.all(
			stationUrls.map(async (station) => {
				try {
					const url = new URL(`${station.replace(/\/$/, '')}/observations`);
					url.searchParams.set('start', new Date(Date.now() - 26 * 3600000).toISOString());
					url.searchParams.set('limit', '500');
					const data = await get(url.href);
					return currentWeatherFromObservations(
						(data.features ?? []).map((f: { properties: Observation }) => f.properties),
						timeZone
					);
				} catch {
					return null;
				}
			})
		);
		return observations.find(Boolean) ?? null;
	} catch {
		return null;
	}
}
