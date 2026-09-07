import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const indexPath = new URL('apps/web/static/.well-known/agent-skills/index.json', root);
const sourcePath = new URL('skills/wxcn/SKILL.md', root);
const publishedPath = new URL(
	'apps/web/static/.well-known/agent-skills/wxcn/SKILL.md',
	root
);

test('Agent Skills discovery index lists the published wxcn skill with a valid digest', async () => {
	const index = JSON.parse(await readFile(indexPath, 'utf8'));
	const source = await readFile(sourcePath);
	const published = await readFile(publishedPath);

	assert.deepEqual(published, source);
	assert.equal(index.$schema, 'https://schemas.agentskills.io/discovery/0.2.0/schema.json');
	assert.equal(index.skills.length, 1);

	const [skill] = index.skills;
	assert.deepEqual(Object.keys(skill).sort(), ['description', 'digest', 'name', 'type', 'url']);
	assert.equal(skill.name, 'wxcn');
	assert.equal(skill.type, 'skill-md');
	assert.equal(skill.description, 'Install, compose, and contribute weather, moon, and tide cards from the wxcn registry. Use for wxcn component integration, data props, native shadcn theming, and framework contributions.');
	assert.equal(skill.url, '/.well-known/agent-skills/wxcn/SKILL.md');
	assert.match(skill.digest, /^sha256:[a-f0-9]{64}$/);
	assert.equal(skill.digest, `sha256:${createHash('sha256').update(published).digest('hex')}`);
});
