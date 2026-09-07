import type { MiddlewareHandler } from 'astro';
import { markdownPages, pageMarkdown } from '$lib/server/markdown.js';
import { prefersMarkdown } from '$lib/server/markdown-request.js';

export const onRequest: MiddlewareHandler = async (event, next) => {
	const { pathname, origin } = event.url;
	const read = event.request.method === 'GET' || event.request.method === 'HEAD';
	const explicit = markdownPages.find((page) => page.markdown === pathname);
	const page =
		explicit ?? markdownPages.find((page) => page.path === (pathname.replace(/\/$/, '') || '/'));
	if (read && pathname === '/llms.txt') {
		const body =
			'# wxcn\n\n> Theme-aware weather, moon, and tide components for shadcn-svelte.\n\n## Documentation\n\n' +
			markdownPages.map((page) => `- [${page.title}](${origin}${page.markdown})`).join('\n') +
			'\n\nRequest any page with Accept: text/markdown or use the links above. Install the wxcn skill from https://github.com/maxffarrell/wxcn-svelte/tree/main/skills/wxcn.\n';
		return new Response(event.request.method === 'HEAD' ? null : body, {
			headers: { 'Content-Type': 'text/plain; charset=utf-8' }
		});
	}
	if (read && page && (explicit || prefersMarkdown(event.request.headers.get('accept') ?? ''))) {
		return new Response(
			event.request.method === 'HEAD' ? null : await pageMarkdown(page.path, origin),
			{
				headers: {
					'Content-Type': 'text/markdown; charset=utf-8',
					Vary: 'Accept',
					'X-Content-Type-Options': 'nosniff'
				}
			}
		);
	}
	const response = await next();
	if (pathname === '/.well-known/ai-catalog.json') {
		response.headers.set('Access-Control-Allow-Origin', '*');
	}
	if (read && page) {
		response.headers.append('Vary', 'Accept');
		response.headers.append('Link', `<${page.markdown}>; rel="alternate"; type="text/markdown"`);
	}
	return response;
};
