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
	'User-Agent': 'wxcn-svelte/0.1 (https://github.com/wxcn-svelte/wxcn-svelte)'
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

export const sampleWeather: WeatherPeriod[] = [
	{
		name: 'Tonight',
		startTime: '2026-06-01T18:00:00-05:00',
		temperature: 68,
		temperatureUnit: 'F',
		windSpeed: '8 mph',
		windDirection: 'SE',
		shortForecast: 'Partly Cloudy',
		detailedForecast:
			'Partly cloudy with a steady southeast breeze. Humidity builds after midnight with calm visibility.',
		isDaytime: false
	},
	{
		name: 'Tuesday',
		startTime: '2026-06-02T06:00:00-05:00',
		temperature: 84,
		temperatureUnit: 'F',
		windSpeed: '12 mph',
		windDirection: 'S',
		shortForecast: 'Warm and Breezy',
		detailedForecast:
			'Warm with scattered afternoon clouds and a steady south wind. A brief shower is possible late.',
		isDaytime: true
	},
	{
		name: 'Tuesday Night',
		startTime: '2026-06-02T18:00:00-05:00',
		temperature: 70,
		temperatureUnit: 'F',
		windSpeed: '10 mph',
		windDirection: 'S',
		shortForecast: 'Chance Showers',
		detailedForecast: 'Cloud cover increases with a chance of light showers before daybreak.',
		isDaytime: false
	}
];
