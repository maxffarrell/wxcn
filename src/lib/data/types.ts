export type ForecastType = 'summary' | 'detailed' | 'simple';
export type IconSet =
	| 'hugeicons'
	| 'phosphor-svelte'
	| 'lucide'
	| 'tabler'
	| 'remix';
export type WeatherUnit = 'fahrenheit' | 'celsius';
export type TideUnit = 'ft' | 'meter';

export type LocationInput = {
	label?: string;
	latitude: number;
	longitude: number;
	station?: string;
};

export type WeatherPeriod = {
	name: string;
	startTime: string;
	temperature: number;
	temperatureUnit: string;
	windSpeed: string;
	windDirection: string;
	shortForecast: string;
	detailedForecast: string;
	isDaytime: boolean;
};

export type TidePrediction = {
	time: string;
	height: string;
	type: 'H' | 'L';
};

export type MoonForecast = {
	date: string;
	phaseName: string;
	illumination: number;
	age: number;
	nextFullMoon: string;
	nextNewMoon: string;
};
