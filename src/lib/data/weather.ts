import type { LocationInput, WeatherPeriod } from './types.js';

type NwsPoint = {
	properties: {
		forecast: string;
		relativeLocation?: {
			properties?: {
				city?: string;
				state?: string;
			};
		};
	};
};

type NwsForecast = {
	properties: {
		periods: WeatherPeriod[];
	};
};

const headers = {
	Accept: 'application/geo+json',
	'User-Agent': 'wxcn/0.1 (https://github.com/wxcn/wxcn)'
};

export async function fetchWeatherForecast(location: LocationInput): Promise<WeatherPeriod[]> {
	const point = await fetch(
		`https://api.weather.gov/points/${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`,
		{ headers }
	);

	if (!point.ok) {
		throw new Error(`NWS point lookup failed with ${point.status}`);
	}

	const pointData = (await point.json()) as NwsPoint;
	const forecast = await fetch(pointData.properties.forecast, { headers });

	if (!forecast.ok) {
		throw new Error(`NWS forecast lookup failed with ${forecast.status}`);
	}

	const forecastData = (await forecast.json()) as NwsForecast;
	return forecastData.properties.periods;
}

/** Deterministic Austin fixtures for previews; not live observations. */
export const sampleWeather: WeatherPeriod[] = [
	['Today', 92, 'Mostly Sunny', true],
	['Tonight', 74, 'Partly Cloudy', false],
	['Monday', 94, 'Sunny', true],
	['Monday night', 75, 'Mostly Clear', false],
	['Tuesday', 89, 'Chance of Rain', true],
	['Tuesday night', 72, 'Partly Cloudy', false],
	['Wednesday', 90, 'Sunny', true]
].map(([name, temperature, shortForecast, isDaytime], index) => ({
	name: name as string,
	temperature: temperature as number,
	shortForecast: shortForecast as string,
	isDaytime: isDaytime as boolean,
	startTime: `2026-09-${String(6 + Math.floor(index / 2)).padStart(2, '0')}T${index % 2 ? '19' : '07'}:00:00-05:00`,
	temperatureUnit: 'F',
	windSpeed: '5 to 10 mph',
	windDirection: 'S',
	detailedForecast: `${shortForecast}. South wind 5 to 10 mph.`
}));

export function convertWindSpeed(speed: string, unit: 'mph' | 'km/h' | 'm/s' | 'knots' = 'mph') {
	const factors = { mph: 0.44704, 'km/h': 1 / 3.6, 'm/s': 1, knots: 0.514444 };
	const source = speed.match(/mph|km\/h|m\/s|knots/);
	if (!source) return speed;
	return speed
		.replace(/\d+(?:\.\d+)?/g, (n) =>
			String(Math.round((Number(n) * factors[source[0] as keyof typeof factors]) / factors[unit]))
		)
		.replace(source[0], unit);
}
