import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { coordinates, loadForecast } from '$lib/server/forecast.js';
export const GET: RequestHandler = async ({ url, fetch }) => {
	let location;
	try {
		location = coordinates(url);
	} catch {
		return json({ message: 'A valid latitude and longitude are required.' }, { status: 400 });
	}
	try {
		return json(await loadForecast(location, fetch), {
			headers: { 'Cache-Control': 'private, max-age=300' }
		});
	} catch (error) {
		return json(
			{ message: error instanceof Error ? error.message : 'Forecast unavailable.' },
			{ status: 503 }
		);
	}
};
