import { readFile, writeFile } from 'node:fs/promises';
import { format } from 'prettier';
const root = new URL('../../', import.meta.url);
const names = { fair: 'clouds', overcast: 'overcast', storm: 'storm', fog: 'fog' };
const entries = await Promise.all(
	Object.entries(names).map(async ([key, name]) => {
		const texture = await readFile(
			new URL(`packages/svelte/src/assets/weather-${name}.webp`, root)
		);
		return `\t${key}:\n\t\t'data:image/webp;base64,${texture.toString('base64')}'`;
	})
);
for (const framework of ['svelte', 'react', 'vue']) {
	await writeFile(
		new URL(`packages/${framework}/src/components/wxcn/cloud-texture.ts`, root),
		await format(
			'// Generated from src/assets/weather-*.webp by tooling/registry/cloud-texture.mjs.\n' +
				'// Embedded so installed registry components never request a third-party image.\n' +
				`export const weatherCloudTextures = {\n${entries.join(',\n')}\n};\n`,
			{
				parser: 'typescript',
				useTabs: true,
				singleQuote: true,
				trailingComma: 'none',
				printWidth: 100
			}
		)
	);
}
for (const framework of ['react', 'vue']) {
	await writeFile(
		new URL(`packages/${framework}/src/components/wxcn/weather-scenes.ts`, root),
		await readFile(new URL('packages/svelte/src/components/wxcn/weather-scenes.ts', root))
	);
}
