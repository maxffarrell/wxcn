import { json } from '@sveltejs/kit';
import { searchLocations } from '$lib/server/location-search.js';
export const GET = ({ url }: { url: URL }) =>
	json(
		{ results: searchLocations(url.searchParams.get('q') ?? '') },
		{ headers: { 'Cache-Control': 'public, max-age=86400' } }
	);
