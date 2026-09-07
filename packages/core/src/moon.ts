import { Body, Illumination, MoonPhase, SearchMoonPhase } from 'astronomy-engine';
import type { MoonForecast } from './types.js';

const phaseNames = [
	'New Moon',
	'Waxing Crescent',
	'First Quarter',
	'Waxing Gibbous',
	'Full Moon',
	'Waning Gibbous',
	'Last Quarter',
	'Waning Crescent'
];

export function getMoonForecast(date = new Date()): MoonForecast {
	const phase = MoonPhase(date) / 360;
	const previousNew = SearchMoonPhase(0, date, -40)!;
	const nextNew = SearchMoonPhase(0, date, 40)!;
	const nextFull = SearchMoonPhase(180, date, 40)!;
	return {
		date: date.toISOString(),
		phase,
		phaseName: phaseNames[Math.round(phase * 8) % 8],
		illumination: Math.round(Illumination(Body.Moon, date).phase_fraction * 100),
		age: Number(((date.getTime() - previousNew.date.getTime()) / 86400000).toFixed(1)),
		nextFullMoon: nextFull.date.toISOString(),
		nextNewMoon: nextNew.date.toISOString()
	};
}

export const sampleMoon = getMoonForecast(new Date('2026-09-06T12:00:00-05:00'));
