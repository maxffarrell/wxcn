import type { CurrentWeather, WeatherPeriod, WeatherUnit } from './types.js';
export function weatherTemperature(value: number, from: string, unit: WeatherUnit) {
	return Math.round(
		unit === 'celsius' && from === 'F'
			? ((value - 32) * 5) / 9
			: unit === 'fahrenheit' && from === 'C'
				? (value * 9) / 5 + 32
				: value
	);
}
export function weatherOutlook(
	current: CurrentWeather | null,
	forecast: WeatherPeriod[],
	unit: WeatherUnit,
	timeZone = 'UTC',
	at = Date.now()
) {
	const day = (time: string | number) =>
		new Intl.DateTimeFormat('en-CA', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).format(new Date(time));
	const today = day(at);
	const valid = forecast.filter(
		(p) =>
			Number.isFinite(p.temperature) &&
			Number.isFinite(Date.parse(p.startTime)) &&
			(!p.endTime || Date.parse(p.endTime) > at)
	);
	const highPeriod = valid.find((p) => p.isDaytime && day(p.startTime) === today);
	const lowPeriod = valid.find(
		(p) =>
			!p.isDaytime &&
			(day(p.startTime) === today ||
				(Date.parse(p.startTime) <= at && !!p.endTime && Date.parse(p.endTime) > at))
	);
	const observedHigh =
		current?.highToday === undefined
			? null
			: weatherTemperature(current.highToday, current.temperatureUnit, unit);
	const high = highPeriod
		? Math.max(
				weatherTemperature(highPeriod.temperature, highPeriod.temperatureUnit, unit),
				observedHigh ?? -Infinity
			)
		: observedHigh;
	const low = lowPeriod
		? weatherTemperature(lowPeriod.temperature, lowPeriod.temperatureUnit, unit)
		: null;
	const temp = current
		? weatherTemperature(current.temperature, current.temperatureUnit, unit)
		: null;
	const highReached =
		high !== null &&
		((observedHigh !== null && observedHigh >= high) || (temp !== null && temp >= high));
	let trend: string | null = null;
	if (temp !== null) {
		if (current?.isDaytime && high !== null && !highReached && temp < high)
			trend = `Going up to ${high}° today`;
		else if (low !== null && temp > low)
			trend = `Going down to ${low}° ${lowPeriod?.name.toLowerCase().includes('overnight') ? 'overnight' : 'tonight'}`;
	}
	return { high, low, trend, highReached };
}
