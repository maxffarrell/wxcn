import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const source = await readFile(new URL('../apps/web/src/lib/webmcp.ts', import.meta.url), 'utf8');

test('WebMCP exposes only bounded navigation and read-only page discovery', () => {
	assert.match(source, /modelContext/);
	assert.match(source, /provideContext\(\{ tools: webmcpTools \}\)/);
	assert.match(source, /provideContext\(\{ tools: \[\] \}\)/);
	assert.match(source, /additionalProperties: false/);
	assert.match(source, /readOnlyHint: true/);
	assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|password|submit\(/i);
});
