/** Only negotiate Markdown when explicitly preferred; ordinary browser requests stay HTML. */
export function prefersMarkdown(accept: string) {
	const values = accept
		.toLowerCase()
		.split(',')
		.map((part) => {
			const [type, ...parameters] = part.trim().split(';');
			const q = parameters.find((p) => p.trim().startsWith('q='));
			return { type: type.trim(), quality: q ? Number(q.trim().slice(2)) : 1 };
		});
	const markdown = Math.max(
		0,
		...values.filter((v) => v.type === 'text/markdown').map((v) => v.quality)
	);
	const html = Math.max(
		0,
		...values
			.filter((v) => v.type === 'text/html' || v.type === 'application/xhtml+xml')
			.map((v) => v.quality)
	);
	return markdown > 0 && markdown >= html;
}
