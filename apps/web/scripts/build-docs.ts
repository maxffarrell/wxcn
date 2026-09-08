import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import registry from '../registry.json' with { type: 'json' };
import reactRegistry from '../../../packages/react/registry.json' with { type: 'json' };
import vueRegistry from '../../../packages/vue/registry.json' with { type: 'json' };
import { codeToHtml } from 'shiki';
import { reactManualIcons } from './react-docs-icons.mjs';
import { transformImports } from 'shadcn-svelte/transformers/imports';
import { transformIcons } from 'shadcn-svelte/transformers/icons';
const overviewExample = readFileSync(
	new URL('../src/lib/components/docs/examples/forecast-dashboard.svelte', import.meta.url),
	'utf8'
);
const weatherExample = readFileSync(
	new URL('../src/lib/components/docs/examples/weather-forecast.svelte', import.meta.url),
	'utf8'
);
const tideExample = readFileSync(
	new URL('../src/lib/components/docs/examples/tide-forecast.svelte', import.meta.url),
	'utf8'
);
const moonExample = readFileSync(
	new URL('../src/lib/components/docs/examples/moon-forecast.svelte', import.meta.url),
	'utf8'
);
const config: Parameters<typeof transformIcons>[0]['config'] = {
	tailwind: { css: 'src/app.css', baseColor: 'neutral' },
	typescript: true,
	registry: 'https://www.shadcn-svelte.com/r',
	sveltekit: true,
	style: 'nova',
	menuColor: 'default',
	menuAccent: 'subtle',
	resolvedPaths: {
		cwd: '.',
		tailwindCss: 'src/app.css',
		utils: 'src/lib/utils.ts',
		components: 'src/lib/components',
		hooks: 'src/lib/hooks',
		ui: 'src/lib/components/ui',
		lib: 'src/lib'
	},
	iconLibrary: 'lucide',
	aliases: {
		lib: '$lib',
		components: '$lib/components',
		ui: '$lib/components/ui',
		utils: '$lib/utils',
		hooks: '$lib/hooks'
	}
};
const highlight = (code: string, lang = 'svelte') =>
	codeToHtml(code, {
		lang,
		themes: { light: 'github-light', dark: 'github-dark' },
		defaultColor: false
	});
export async function load() {
	const descriptions = [
		[
			'forecast-dashboard',
			'ForecastDashboard',
			'All three components, composed into a dashboard.',
			overviewExample
		],
		[
			'weather-forecast',
			'WeatherForecast',
			'Forecast periods with optional atmospheric backgrounds.',
			weatherExample
		],
		[
			'tide-forecast',
			'TideForecast',
			'Nearest coastal tides, with a current reading and interactive prediction curve.',
			tideExample
		],
		[
			'moon-forecast',
			'MoonForecast',
			'Lunar phase, illumination, and astronomically calculated cycle dates.',
			moonExample
		]
	];
	return {
		examples: await Promise.all(
			descriptions.map(async ([name, title, description, rawCode]) => {
				const code = rawCode.replaceAll('@wxcn/svelte/components/', '$lib/components/');
				const items =
					name === 'forecast-dashboard'
						? [
								...registry.items.filter((i) => i.name === name),
								...registry.items.filter((i) => i.name !== name)
							]
						: registry.items.filter((i) => i.name === name);
				const files = [
					...new Map(items.flatMap((i) => i.files).map((f) => [f.target, f])).values()
				];
				return {
					name,
					title,
					description,
					code,
					html: await highlight(code),
					primitives: [
						...new Set(
							items.flatMap((i) => i.registryDependencies).filter((d) => !d.startsWith('.'))
						)
					],
					dependencies:
						name === 'tide-forecast' || name === 'forecast-dashboard'
							? [
									'@lucide/svelte',
									'@number-flow/svelte@^0.4.2',
									'layerchart@^2.4.0',
									'd3-shape@^3.2.0',
									'@types/d3-shape'
								]
							: ['@lucide/svelte'],
					files: await Promise.all(
						files.map(async (f) => {
							const icons = await transformIcons({
								content: f.content,
								filePath: f.target,
								config
							});
							const result = await transformImports({
								content: icons.content ?? f.content,
								filePath: f.target,
								config
							});
							return {
								path: `src/lib/${f.type === 'registry:component' ? 'components/' : ''}${f.target}`,
								code: result.content ?? f.content,
								html: await highlight(
									result.content ?? f.content,
									f.target.endsWith('.svelte') ? 'svelte' : 'typescript'
								)
							};
						})
					)
				};
			})
		)
	};
}

async function loadReact() {
	const descriptions = [
		['forecast-dashboard', 'ForecastDashboard', 'All three components, composed into a dashboard.'],
		[
			'weather-forecast',
			'WeatherForecast',
			'Forecast periods with optional atmospheric backgrounds.'
		],
		[
			'tide-forecast',
			'TideForecast',
			'Nearest coastal tides, with a current reading and interactive prediction curve.'
		],
		[
			'moon-forecast',
			'MoonForecast',
			'Lunar phase, illumination, and astronomically calculated cycle dates.'
		]
	];
	return {
		examples: await Promise.all(
			descriptions.map(async ([name, title, description]) => {
				const code = readFileSync(
					new URL(`../src/lib/components/docs/examples/react/${name}.tsx`, import.meta.url),
					'utf8'
				);
				const items =
					name === 'forecast-dashboard'
						? [
								...reactRegistry.items.filter((item) => item.name === name),
								...reactRegistry.items.filter((item) => item.name !== name)
							]
						: reactRegistry.items.filter((item) => item.name === name);
				const files = [
					...new Map(
						items.flatMap((item) => item.files).map((file) => [file.target, file])
					).values()
				];
				return {
					name,
					title,
					description,
					code,
					html: await highlight(code, 'tsx'),
					primitives: [
						...new Set(
							items
								.flatMap((item) => item.registryDependencies)
								.filter(
									(dependency) => !dependency.startsWith('https://') && !dependency.startsWith('.')
								)
						)
					],
					dependencies: [
						...new Set(
							items.flatMap((item) => ('dependencies' in item ? (item.dependencies ?? []) : []))
						)
					],
					files: await Promise.all(
						files.map(async (file) => {
							const content = file.target.endsWith('/forecast-icons.tsx')
								? reactManualIcons(file.content)
								: file.content;
							return {
								path: file.target
									.replace(/^@components\//, 'src/components/')
									.replace(/^@lib\//, 'src/lib/'),
								code: content,
								html: await highlight(content, file.target.endsWith('.tsx') ? 'tsx' : 'typescript')
							};
						})
					)
				};
			})
		)
	};
}

function vueManualImports(content: string) {
	return content
		.replaceAll('@/registry/wxcn/components/', '@/components/')
		.replaceAll('@/registry/wxcn/lib/', '@/lib/')
		.replaceAll('@/registry/wxcn/ui/', '@/components/ui/');
}

async function loadVue() {
	const descriptions = [
		['forecast-dashboard', 'ForecastDashboard', 'All three components, composed into a dashboard.'],
		[
			'weather-forecast',
			'WeatherForecast',
			'Forecast periods with optional atmospheric backgrounds.'
		],
		[
			'tide-forecast',
			'TideForecast',
			'Nearest coastal tides, with a current reading and interactive prediction curve.'
		],
		['moon-forecast', 'MoonForecast', 'Lunar phase, illumination, and astronomical cycle dates.']
	];
	return {
		examples: await Promise.all(
			descriptions.map(async ([name, title, description]) => {
				const code = readFileSync(
					new URL(`../src/lib/components/docs/examples/vue/${name}.vue`, import.meta.url),
					'utf8'
				);
				const items =
					name === 'forecast-dashboard'
						? [
								...vueRegistry.items.filter((item) => item.name === name),
								...vueRegistry.items.filter((item) => item.name !== name)
							]
						: vueRegistry.items.filter((item) => item.name === name);
				const files = [
					...new Map(items.flatMap((item) => item.files).map((file) => [file.path, file])).values()
				];
				return {
					name,
					title,
					description,
					code,
					html: await highlight(code, 'vue'),
					primitives: [
						...new Set(
							items
								.flatMap((item) => item.registryDependencies)
								.filter(
									(dependency) => !dependency.startsWith('https://') && !dependency.startsWith('.')
								)
						)
					],
					dependencies: [
						...new Set(
							items.flatMap((item) => ('dependencies' in item ? (item.dependencies ?? []) : []))
						)
					],
					files: await Promise.all(
						files.map(async (file) => ({
							path: file.path.replace(/^registry\//, 'src/'),
							code: vueManualImports(file.content),
							html: await highlight(
								vueManualImports(file.content),
								file.path.endsWith('.vue') ? 'vue' : 'typescript'
							)
						}))
					)
				};
			})
		)
	};
}

const destination = new URL('../src/lib/server/generated/', import.meta.url);
mkdirSync(destination, { recursive: true });
writeFileSync(new URL('component-docs.json', destination), JSON.stringify(await load()));
writeFileSync(new URL('component-docs-react.json', destination), JSON.stringify(await loadReact()));
writeFileSync(new URL('component-docs-vue.json', destination), JSON.stringify(await loadVue()));
console.log('Generated component documentation and syntax highlighting.');
