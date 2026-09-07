import {
	Body,
	Equator,
	Horizon,
	Illumination,
	MoonPhase,
	Observer,
	SearchHourAngle,
	SearchRiseSet
} from 'astronomy-engine';

export type SkyPeriod = 'sunrise' | 'midday' | 'sunset' | 'night';
export type SkyBody = { azimuth: number; altitude: number; visible: boolean; x: number; y: number };
export type SkyState = {
	at: number;
	period: SkyPeriod;
	isDaytime: boolean;
	sun: SkyBody;
	moon: SkyBody & {
		illumination: number;
		phase: number;
		phaseName: string;
		light: [number, number, number];
	};
};
const rad = Math.PI / 180;
const cache = new Map<string, SkyState>();
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

// Fixed 360-degree panorama: N at both edges, E at 25%, S at 50%, W at 75%.
// Altitude maps from the horizon at 12% to the zenith at 88% of card height.
// Discs are enlarged for readability; coordinates retain their astronomical values.
function project(azimuth: number, altitude: number): SkyBody {
	return {
		azimuth,
		altitude,
		visible: altitude >= -0.2666,
		x: azimuth / 360,
		y: 0.12 + (altitude / 90) * 0.76
	};
}
function valid(latitude: number, longitude: number, at: number) {
	return (
		Number.isFinite(latitude) &&
		Math.abs(latitude) <= 90 &&
		Number.isFinite(longitude) &&
		Math.abs(longitude) <= 180 &&
		Number.isFinite(at) &&
		Math.abs(at) <= 8640000000000000
	);
}
export function getSkyState(latitude: number, longitude: number, at = Date.now()): SkyState | null {
	if (!valid(latitude, longitude, at)) return null;
	// Cards request positions once per minute; preserve an explicit event timestamp.
	const key = `${latitude}:${longitude}:${at}`;
	const cached = cache.get(key);
	if (cached) return cached;
	const date = new Date(at);
	const observer = new Observer(latitude, longitude, 0);
	function position(body: Body, instant = date) {
		const eq = Equator(body, instant, observer, true, true);
		return Horizon(instant, observer, eq.ra, eq.dec, 'normal');
	}
	const sunPosition = position(Body.Sun);
	const moonPosition = position(Body.Moon);
	const sun = project(sunPosition.azimuth, sunPosition.altitude);
	// Apparent upper solar limb at the horizon (refraction is applied by Horizon).
	const isDaytime = sun.altitude >= -0.2666;
	const rising = position(Body.Sun, new Date(at + 60000)).altitude > sun.altitude;
	const period: SkyPeriod =
		sun.altitude < -6 ? 'night' : sun.altitude <= 6 ? (rising ? 'sunrise' : 'sunset') : 'midday';
	const illumination = Illumination(Body.Moon, date).phase_fraction;
	const phase = MoonPhase(date) / 360;
	// Project the Sun onto the Moon's local horizon tangent plane. This gives the
	// illuminated limb its observer-relative tilt, including hemisphere differences.
	const sa = sun.azimuth * rad,
		sh = sun.altitude * rad;
	const ma = moonPosition.azimuth * rad,
		mh = moonPosition.altitude * rad;
	const sx = Math.cos(sh) * Math.sin(sa),
		sy = Math.sin(sh),
		sz = Math.cos(sh) * Math.cos(sa);
	const right = sx * Math.cos(ma) - sz * Math.sin(ma);
	const up =
		-sx * Math.sin(mh) * Math.sin(ma) + sy * Math.cos(mh) - sz * Math.sin(mh) * Math.cos(ma);
	const length = Math.hypot(right, up) || 1;
	const z = 2 * illumination - 1;
	const tangent = Math.sqrt(Math.max(0, 1 - z * z));
	const state: SkyState = {
		at,
		period,
		isDaytime,
		sun,
		moon: {
			...project(moonPosition.azimuth, moonPosition.altitude),
			illumination,
			phase,
			phaseName: phaseNames[Math.round(phase * 8) % 8],
			light: [(right / length) * tangent, (up / length) * tangent, z]
		}
	};
	if (cache.size >= 256) cache.delete(cache.keys().next().value!);
	cache.set(key, state);
	return state;
}

export function getSkyPreviewTime(
	latitude: number,
	longitude: number,
	at: number,
	period: SkyPeriod
): number | null {
	if (!valid(latitude, longitude, at)) return null;
	const observer = new Observer(latitude, longitude, 0);
	const start = new Date(at - 12 * 3600000);
	const event =
		period === 'sunrise' || period === 'sunset'
			? SearchRiseSet(Body.Sun, observer, period === 'sunrise' ? 1 : -1, start, 1)
			: SearchHourAngle(Body.Sun, observer, period === 'midday' ? 0 : 12, start).time;
	return event?.date.getTime() ?? null; // Polar day/night can have no rise or set.
}
