import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../../', import.meta.url);
const names = { fair: 'clouds', overcast: 'overcast', storm: 'storm', fog: 'fog' };
const entries = await Promise.all(
	Object.entries(names).map(async ([key, name]) => {
		const texture = await readFile(
			new URL(`packages/svelte/src/assets/weather-${name}.webp`, root)
		);
		return `\t${key}: 'data:image/webp;base64,${texture.toString('base64')}'`;
	})
);
await writeFile(
	new URL('packages/svelte/src/components/wxcn/cloud-texture.ts', root),
	'// Generated from src/assets/weather-*.webp by tooling/registry/cloud-texture.mjs.\n' +
		'// Embedded so installed registry components never request a third-party image.\n' +
		`export const weatherCloudTextures = {\n${entries.join(',\n')}\n};\n`
);
