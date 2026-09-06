import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { icons } from './icon-map.mjs';
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const iconSource = `<script lang="ts">
 import IconPlaceholder from '$lib/components/icon-placeholder.svelte';
 import type { IconSet } from '$LIB$/data/types.js';
 let { name, class: className = 'size-5' }: { name: ${Object.keys(icons)
		.map((n) => `'${n}'`)
		.join(' | ')}; class?: string; iconSet?: IconSet } = $props();
</script>
${Object.entries(icons)
	.map(
		([name, libs], index) => `${index ? '{:else if' : '{#if'} name === '${name}'}
 <IconPlaceholder ${Object.entries(libs)
		.map(([lib, icon]) => `${lib}="${icon}"`)
		.join(' ')} class={className} aria-hidden="true" />`
	)
	.join('\n')}
{/if}
`;
async function file(path, type, target) {
	const content = path.endsWith('forecast-icons.svelte')
		? iconSource
		: (await read(path))
				.replaceAll('$lib/components/ui', '$UI$')
				.replaceAll('$lib/components', '$COMPONENTS$')
				.replaceAll('$lib/icons', '$COMPONENTS$/icons')
				.replaceAll('$lib/data', '$LIB$/data')
				.replaceAll('$lib/utils', '$UTILS$');
	return { path, type, target, content };
}
const common = await Promise.all([
	file('src/lib/data/types.ts', 'registry:lib', 'data/types.ts'),
	file('src/lib/icons/forecast-icons.svelte', 'registry:component', 'icons/forecast-icons.svelte')
]);
const definitions = [
	[
		'weather-forecast',
		'WeatherForecast',
		'weather',
		'Weather forecast with optional atmospheric backgrounds.',
		['card', 'badge']
	],
	[
		'moon-forecast',
		'MoonForecast',
		'moon',
		'Lunar phase card with local cycle estimates.',
		['card']
	],
	[
		'tide-forecast',
		'TideForecast',
		'tides',
		'Coastal tide predictions with a theme-aware chart.',
		['card']
	]
];
const items = [];
for (const [name, component, data, description, registryDependencies] of definitions) {
	const files = [
		await file(
			`src/lib/components/wxcn/${component}.svelte`,
			'registry:component',
			`wxcn/${component}.svelte`
		),
		await file(`src/lib/data/${data}.ts`, 'registry:lib', `data/${data}.ts`),
		...common
	];
	if (name === 'weather-forecast')
		files.push(
			await file(
				'src/lib/components/wxcn/WeatherShaderBackground.svelte',
				'registry:component',
				'wxcn/WeatherShaderBackground.svelte'
			)
		);
	if (name === 'moon-forecast')
		files.push(
			await file(
				'src/lib/components/wxcn/MoonDisc.svelte',
				'registry:component',
				'wxcn/MoonDisc.svelte'
			)
		);
	if (name === 'tide-forecast')
		files.push(await file('src/lib/data/tide-state.ts', 'registry:lib', 'data/tide-state.ts'));
	items.push({
		$schema: 'https://shadcn-svelte.com/schema/registry-item.json',
		name,
		type: 'registry:component',
		description,
		registryDependencies,
		...(name === 'tide-forecast'
			? {
					dependencies: ['layerchart@^2.4.0', 'd3-shape@^3.2.0'],
					devDependencies: ['@types/d3-shape@^3.1.0']
				}
			: {}),
		files
	});
}
items.push({
	$schema: 'https://shadcn-svelte.com/schema/registry-item.json',
	name: 'forecast-dashboard',
	type: 'registry:block',
	description: 'Weather and moon for Austin, with a separate coastal tide card.',
	registryDependencies: ['./weather-forecast.json', './moon-forecast.json', './tide-forecast.json'],
	files: [
		await file(
			'src/lib/components/wxcn/ForecastDashboard.svelte',
			'registry:component',
			'wxcn/ForecastDashboard.svelte'
		)
	]
});
await mkdir(new URL('../static/r/', import.meta.url), { recursive: true });
for (const item of items)
	await writeFile(
		new URL(`../static/r/${item.name}.json`, import.meta.url),
		JSON.stringify(item, null, 2) + '\n'
	);
await writeFile(
	new URL('../registry.json', import.meta.url),
	JSON.stringify(
		{
			$schema: 'https://shadcn-svelte.com/schema/registry.json',
			name: 'wxcn',
			homepage: 'https://wxcn.dev',
			items
		},
		null,
		2
	) + '\n'
);
console.log(`Built ${items.length} self-contained registry items.`);
