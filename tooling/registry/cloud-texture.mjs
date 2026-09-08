import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../../', import.meta.url);
const texture = await readFile(new URL('packages/svelte/src/assets/weather-clouds.webp', root));
await writeFile(
	new URL('packages/svelte/src/components/wxcn/cloud-texture.ts', root),
	'// Generated from src/assets/weather-clouds.webp by tooling/registry/cloud-texture.mjs.\n' +
		'// Embedded so installed registry components never request a third-party image.\n' +
		"export const weatherCloudTexture =\n\t'data:image/webp;base64," +
		texture.toString('base64') +
		"';\n"
);
