import type { MoonForecast } from './types.js';

const synodicMonth = 29.530588853;
const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
const dayMs = 86_400_000;

function phaseName(age: number) {
	if (age < 1.84566) return 'New Moon';
	if (age < 5.53699) return 'Waxing Crescent';
	if (age < 9.22831) return 'First Quarter';
	if (age < 12.91963) return 'Waxing Gibbous';
	if (age < 16.61096) return 'Full Moon';
	if (age < 20.30228) return 'Waning Gibbous';
	if (age < 23.99361) return 'Last Quarter';
	if (age < 27.68493) return 'Waning Crescent';
	return 'New Moon';
}

function addDays(date: Date, days: number) {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

export function getMoonForecast(date = new Date()): MoonForecast {
	const daysSince = (date.getTime() - knownNewMoon) / dayMs;
	const cycles = daysSince / synodicMonth;
	const age = (cycles - Math.floor(cycles)) * synodicMonth;
	const angle = (age / synodicMonth) * Math.PI * 2;
	const illumination = Math.round(((1 - Math.cos(angle)) / 2) * 100);
	const daysToNew = synodicMonth - age;
	const daysToFull = age < synodicMonth / 2 ? synodicMonth / 2 - age : synodicMonth * 1.5 - age;

	return {
		date: date.toISOString(),
		phaseName: phaseName(age),
		illumination,
		age: Number(age.toFixed(1)),
		nextFullMoon: addDays(date, Math.ceil(daysToFull)).toISOString(),
		nextNewMoon: addDays(date, Math.ceil(daysToNew)).toISOString()
	};
}

export const sampleMoon = getMoonForecast(new Date('2026-06-01T12:00:00Z'));
