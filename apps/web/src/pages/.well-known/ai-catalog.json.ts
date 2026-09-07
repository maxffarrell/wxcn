import type { APIRoute } from 'astro';
import catalog from '../../data/ai-catalog.json';

export const GET: APIRoute = () =>
	new Response(JSON.stringify(catalog), {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Content-Type': 'application/json; charset=utf-8'
		}
	});
