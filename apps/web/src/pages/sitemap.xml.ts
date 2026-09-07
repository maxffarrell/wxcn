import type { APIRoute } from 'astro';
import { publicRoutes, siteUrl } from '../lib/site-routes.mjs';

const escapeXml = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('"', '&quot;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;');

export const GET: APIRoute = () => {
	const urls = publicRoutes
		.map((route) => `\t<url><loc>${escapeXml(new URL(route, siteUrl).href)}</loc></url>`)
		.join('\n');

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
		{ headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
	);
};
