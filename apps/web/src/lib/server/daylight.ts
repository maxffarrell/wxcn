import { getSkyState } from '@wxcn/core/sky.js';

export function isDaylight(latitude: number, longitude: number, at = Date.now()): boolean {
	return getSkyState(latitude, longitude, at)?.isDaytime ?? false;
}
