export * from './components/wxcn/weather-forecast';
export * from './components/wxcn/moon-forecast';
export * from './components/wxcn/tide-forecast';
export * from './components/wxcn/forecast-dashboard';

export { fetchWeatherForecast } from '@wxcn/core/weather.js';
export { fetchTidePredictions } from '@wxcn/core/tides.js';
export { getMoonForecast } from '@wxcn/core/moon.js';
export { getSkyState } from '@wxcn/core/sky.js';
export type { SkyState, SkyBody, SkyPeriod } from '@wxcn/core/sky.js';
export type {
	ForecastType,
	CardSize,
	CardDensity,
	LocationInput,
	WeatherPeriod,
	WeatherBackground,
	CurrentWeather,
	TidePrediction,
	TidePoint,
	TideReading,
	MoonForecast as MoonForecastData
} from '@wxcn/core/types.js';
export type { IconSet } from './icons/forecast-icons';
