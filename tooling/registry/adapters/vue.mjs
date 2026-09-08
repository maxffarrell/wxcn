import { readFile } from 'node:fs/promises';
import { icons } from './svelte-icons.mjs';

const root = new URL('../../../', import.meta.url);
const componentImport = '@/registry/wxcn/components/wxcn/';
const libImport = '@/registry/wxcn/lib/wxcn/';
const vueIcons = {
	arrowUp: 'ArrowUpIcon',
	arrowDown: 'ArrowDownIcon',
	weather: 'CloudSunIcon',
	sun: 'SunIcon',
	moon: 'MoonIcon',
	tide: 'WavesIcon',
	wind: 'WindIcon',
	rain: 'CloudRainIcon',
	snow: 'SnowflakeIcon'
};

const iconSource = `<script setup lang="ts">
// shadcn-vue currently maps the navigation arrows across icon libraries, but
// its public icon index has no CloudSun, Waves, Wind, CloudRain or Snowflake
// entries. Keep those semantic forecast glyphs through an npm alias instead
// of silently substituting unrelated mapped icons.
import { ArrowDownIcon, ArrowUpIcon } from '@lucide/vue';
import { CloudRainIcon, CloudSunIcon, MoonIcon, SnowflakeIcon, SunIcon, WavesIcon, WindIcon } from 'wxcn-lucide';
export type IconName = ${Object.keys(icons)
	.map((name) => `'${name}'`)
	.join(' | ')};
export type IconSet = 'lucide' | 'tabler' | 'phosphor' | 'hugeicons' | 'remixicon';
withDefaults(defineProps<{ name: IconName; iconSet?: IconSet; class?: string }>(), {
 class: 'size-5'
});
</script>
<template>
${Object.entries(vueIcons)
	.map(
		([name, icon], index) =>
			` <${icon} ${index ? 'v-else-if' : 'v-if'}="name === '${name}'" :class="$props.class" aria-hidden="true" />`
	)
	.join('\n')}
</template>
`;

async function file(path, type, registryPath) {
	let content = path.endsWith('ForecastIcon.vue') ? iconSource : await readFile(new URL(path, root), 'utf8');
	content = content.replaceAll(/@wxcn\/core\/([\w-]+)\.js/g, `${libImport}$1`);
	if (path.startsWith('packages/core/')) {
		content = content.replaceAll(/from\s*(['"])\.\/([\w-]+)\.js\1/g, `from '${libImport}$2'`);
	} else if (path.endsWith('.vue')) {
		content = content
			.replaceAll(/from\s*(['"])\.\.\/ui\/([\w-]+)\1/g, `from '@/registry/wxcn/ui/$2'`)
			.replaceAll(
				/from\s*(['"])\.\.\/\.\.\/icons\/ForecastIcon\.vue\1/g,
				`from '${componentImport}ForecastIcon.vue'`
			)
			.replaceAll(/from\s*(['"])\.\.\/\.\.\/lib\/utils\1/g, "from '@/lib/utils'")
			.replaceAll(/from\s*(['"])\.\/([\w-]+)(\.vue)?\1/g, `from '${componentImport}$2$3'`);
	}
	return { path: registryPath, type, content };
}

const common = async () => [
	await file(
		'packages/vue/src/components/wxcn/ForecastScreens.vue',
		'registry:component',
		'registry/components/wxcn/ForecastScreens.vue'
	),
	await file(
		'packages/vue/src/icons/ForecastIcon.vue',
		'registry:component',
		'registry/components/wxcn/ForecastIcon.vue'
	),
	await file('packages/core/src/types.ts', 'registry:lib', 'registry/lib/wxcn/types.ts'),
	await file(
		'packages/core/src/forecast-days.ts',
		'registry:lib',
		'registry/lib/wxcn/forecast-days.ts'
	)
];

const definitions = [
	[
		'weather-forecast',
		'WeatherForecast',
		'Weather forecast with optional atmospheric backgrounds.',
		['weather', 'weather-outlook', 'sky'],
		['WeatherGradientBackground', 'WeatherShaderBackground'],
		['card', 'button']
	],
	[
		'moon-forecast',
		'MoonForecast',
		'Lunar phase card with local cycle estimates.',
		['moon'],
		['MoonDisc'],
		['card', 'button']
	],
	[
		'tide-forecast',
		'TideForecast',
		'Coastal tide predictions with a theme-aware chart.',
		['tides', 'tide-state'],
		[],
		['card', 'button']
	]
];

const items = [];
for (const [name, component, description, helpers, components, registryDependencies] of definitions) {
	const files = [
		await file(
			`packages/vue/src/components/wxcn/${component}.vue`,
			'registry:component',
			`registry/components/wxcn/${component}.vue`
		),
		...(await common())
	];
	for (const helper of helpers)
		files.push(
			await file(`packages/core/src/${helper}.ts`, 'registry:lib', `registry/lib/wxcn/${helper}.ts`)
		);
	for (const support of components)
		files.push(
			await file(
				`packages/vue/src/components/wxcn/${support}.vue`,
				'registry:component',
				`registry/components/wxcn/${support}.vue`
			)
		);
	items.push({
		$schema: 'https://shadcn-vue.com/schema/registry-item.json',
		name,
		type: 'registry:component',
		description,
		registryDependencies,
		...(name === 'weather-forecast' || name === 'moon-forecast'
			? {
					dependencies: [
						'@lucide/vue',
						'wxcn-lucide@npm:@lucide/vue@^1.42.0',
						'astronomy-engine@2.1.19',
						...(name === 'weather-forecast' ? ['@number-flow/vue@^0.5.2'] : [])
					]
				}
			: {}),
		...(name === 'tide-forecast'
			? {
					dependencies: [
						'@lucide/vue',
						'wxcn-lucide@npm:@lucide/vue@^1.42.0',
						'@number-flow/vue@^0.5.2',
                        'd3-shape@^3.2.0'
					],
                    devDependencies: ['@types/d3-shape@^3.2.0']
				}
			: {}),
		files
	});
}

items.push({
	$schema: 'https://shadcn-vue.com/schema/registry-item.json',
	name: 'forecast-dashboard',
	type: 'registry:block',
	description: 'Weather and moon for Austin, with a separate coastal tide card.',
	registryDependencies: [
		'https://wxcn.dev/r/vue/weather-forecast.json',
		'https://wxcn.dev/r/vue/moon-forecast.json',
		'https://wxcn.dev/r/vue/tide-forecast.json'
	],
	files: [
		await file(
			'packages/vue/src/components/wxcn/ForecastDashboard.vue',
			'registry:component',
			'registry/components/wxcn/ForecastDashboard.vue'
		)
	]
});

export const vueRegistry = {
	$schema: 'https://shadcn-vue.com/schema/registry.json',
	name: 'wxcn',
	homepage: 'https://wxcn.dev/vue',
	items
};
