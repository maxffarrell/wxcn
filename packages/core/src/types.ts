export type CardSize = 'sm' | 'default' | 'lg';
export type CardDensity = 'compact' | 'comfortable';
export type ForecastType = 'summary' | 'detailed' | 'simple';
export type IconSet = 'hugeicons' | 'phosphor-svelte' | 'lucide' | 'tabler' | 'remix';
export type WeatherUnit = 'fahrenheit' | 'celsius';
export type TideUnit = 'ft' | 'meter';

export type LocationInput = {
	label?: string;
	latitude: number;
	longitude: number;
	station?: string;
	timeZone?: string;
};

export type WeatherPeriod = {
	name: string;
	startTime: string;
	endTime?: string;
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

/** Feet above MLLW. Prefer ISO 8601 timestamps with an explicit offset. */
export type TidePoint = { time: string; height: string };
export type TideReading = TidePoint;

/** Current observed conditions; daily extrema use temperatureUnit and the location's calendar day. */
export type CurrentWeather = WeatherPeriod & {
	observedAt: string;
	highToday?: number;
	lowToday?: number;
};
