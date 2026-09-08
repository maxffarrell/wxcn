export { default as WeatherForecast } from './components/wxcn/WeatherForecast.vue';
export { default as TideForecast } from './components/wxcn/TideForecast.vue';
export { default as MoonForecast } from './components/wxcn/MoonForecast.vue';
export { default as ForecastDashboard } from './components/wxcn/ForecastDashboard.vue';
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
export type { IconSet } from './icons/ForecastIcon.vue';
