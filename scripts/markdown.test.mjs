import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prefersMarkdown } from '../apps/web/src/lib/server/markdown-request.ts';

test('Markdown content negotiation honors explicit media types and quality values', () => {
	for (const accept of [
		'',
		'*/*',
		'text/html,application/xhtml+xml,*/*;q=0.8',
		'text/markdown;q=0',
		'text/html;q=1,text/markdown;q=0.5'
	])
		assert.equal(prefersMarkdown(accept), false, accept);
	for (const accept of [
		'text/markdown',
		'text/markdown,text/html;q=0.5',
		'TEXT/MARKDOWN; charset=utf-8'
	])
		assert.equal(prefersMarkdown(accept), true, accept);
});
