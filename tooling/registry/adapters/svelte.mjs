import { readFile } from 'node:fs/promises';
import { icons } from './svelte-icons.mjs';
const read = (path) => readFile(new URL(`../../../${path}`, import.meta.url), 'utf8');
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
				.replaceAll('../ui/', '$UI$/')
				.replaceAll('../../icons/', '$COMPONENTS$/icons/')

				.replaceAll('@wxcn/core/', '$LIB$/data/')
				.replaceAll('../../utils.js', '$UTILS$');
	return { path, type, target, content };
}
const common = await Promise.all([
	file('packages/core/src/forecast-days.ts', 'registry:lib', 'data/forecast-days.ts'),
	file(
		'packages/svelte/src/components/wxcn/ForecastScreens.svelte',
		'registry:component',
		'wxcn/ForecastScreens.svelte'
	),
	file('packages/core/src/types.ts', 'registry:lib', 'data/types.ts'),
	file(
		'packages/svelte/src/icons/forecast-icons.svelte',
		'registry:component',
		'icons/forecast-icons.svelte'
	)
]);
const definitions = [
	[
		'weather-forecast',
		'WeatherForecast',
		'weather',
		'Weather forecast with optional atmospheric backgrounds.',
		['card', 'button']
	],
	[
		'moon-forecast',
		'MoonForecast',
		'moon',
		'Lunar phase card with local cycle estimates.',
		['card', 'button']
	],
	[
		'tide-forecast',
		'TideForecast',
		'tides',
		'Coastal tide predictions with a theme-aware chart.',
		['card', 'chart', 'button']
	]
];
const items = [];
for (const [name, component, data, description, registryDependencies] of definitions) {
	const files = [
		await file(
			`packages/svelte/src/components/wxcn/${component}.svelte`,
			'registry:component',
			`wxcn/${component}.svelte`
		),
		await file(`packages/core/src/${data}.ts`, 'registry:lib', `data/${data}.ts`),
		...common
	];
	if (name === 'weather-forecast')
		files.push(
			await file(
				'packages/svelte/src/components/wxcn/WeatherGradientBackground.svelte',
				'registry:component',
				'wxcn/WeatherGradientBackground.svelte'
			),
			await file(
				'packages/svelte/src/components/wxcn/cloud-texture.ts',
				'registry:component',
				'wxcn/cloud-texture.ts'
			),
			await file('packages/core/src/sky.ts', 'registry:lib', 'data/sky.ts'),
			await file('packages/core/src/weather-outlook.ts', 'registry:lib', 'data/weather-outlook.ts'),
			await file(
				'packages/svelte/src/components/wxcn/WeatherShaderBackground.svelte',
				'registry:component',
				'wxcn/WeatherShaderBackground.svelte'
			)
		);
	if (name === 'moon-forecast')
		files.push(
			await file(
				'packages/svelte/src/components/wxcn/MoonDisc.svelte',
				'registry:component',
				'wxcn/MoonDisc.svelte'
			)
		);
	if (name === 'tide-forecast')
		files.push(await file('packages/core/src/tide-state.ts', 'registry:lib', 'data/tide-state.ts'));
	items.push({
		$schema: 'https://shadcn-svelte.com/schema/registry-item.json',
		name,
		type: 'registry:component',
		description,
		registryDependencies,
		...(name === 'weather-forecast' || name === 'moon-forecast'
			? { dependencies: ['astronomy-engine@2.1.19'] }
			: {}),
		...(name === 'tide-forecast'
			? {
					dependencies: ['@number-flow/svelte@^0.4.2', 'layerchart@^2.4.0', 'd3-shape@^3.2.0'],
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
			'packages/svelte/src/components/wxcn/ForecastDashboard.svelte',
			'registry:component',
			'wxcn/ForecastDashboard.svelte'
		)
	]
});
export const svelteRegistry = {
	$schema: 'https://shadcn-svelte.com/schema/registry.json',
	name: 'wxcn',
	homepage: 'https://wxcn.dev',
	items
};
