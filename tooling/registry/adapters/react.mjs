import { readFile } from 'node:fs/promises';
const root = new URL('../../../', import.meta.url);
import { icons } from './svelte-icons.mjs';
const iconSource = `import { IconPlaceholder } from '@/components/icon-placeholder';
export type IconName = ${Object.keys(icons)
	.map((n) => `'${n}'`)
	.join(' | ')};
export type IconSet = 'lucide' | 'tabler' | 'phosphor' | 'hugeicons' | 'remixicon';
export type ForecastIconProps = { name: IconName; iconSet?: IconSet; className?: string };
export function ForecastIcon({ name, className = 'size-5' }: ForecastIconProps) {
 switch (name) {
 ${Object.entries(icons)
		.map(
			([name, libs]) =>
				`case '${name}': return <IconPlaceholder ${Object.entries(libs)
					.map(([lib, icon]) => `${lib}="${icon}"`)
					.join(' ')} className={className} aria-hidden="true" />;`
		)
		.join('\n')}
 }
}
`;
async function file(path, type, target) {
	const content = path.endsWith('forecast-icons.tsx')
		? iconSource
		: (await readFile(new URL(path, root), 'utf8'))
				.replaceAll('@wxcn/core/', '@/lib/wxcn/')
				.replaceAll('../../icons/forecast-icons', './forecast-icons');
	return { path, type, target, content };
}
const definitions = [
	[
		'weather-forecast',
		'Weather forecast with optional atmospheric backgrounds.',
		['weather', 'weather-outlook', 'sky'],
		['weather-shader-background', 'weather-gradient-background'],
		['card']
	],
	[
		'moon-forecast',
		'Lunar phase card with local cycle estimates.',
		['moon'],
		['moon-disc'],
		['card']
	],
	[
		'tide-forecast',
		'Coastal tide predictions with a theme-aware chart.',
		['tides', 'tide-state'],
		[],
		['card', 'badge', 'chart']
	]
];
const items = [];
for (const [name, description, helpers, components, registryDependencies] of definitions) {
	const files = await Promise.all([
		...(name === 'weather-forecast'
			? ['cloud-texture', 'weather-scenes'].map((helper) =>
					file(
						`packages/react/src/components/wxcn/${helper}.ts`,
						'registry:component',
						`@components/wxcn/${helper}.ts`
					)
				)
			: []),
		...[name, 'forecast-screens', ...components].map((name) =>
			file(
				`packages/react/src/components/wxcn/${name}.tsx`,
				'registry:component',
				`@components/wxcn/${name}.tsx`
			)
		),
		file(
			'packages/react/src/icons/forecast-icons.tsx',
			'registry:component',
			'@components/wxcn/forecast-icons.tsx'
		),
		...['types', 'forecast-days', ...helpers].map((name) =>
			file(`packages/core/src/${name}.ts`, 'registry:lib', `@lib/wxcn/${name}.ts`)
		)
	]);
	items.push({
		$schema: 'https://ui.shadcn.com/schema/registry-item.json',
		name,
		type: 'registry:component',
		description,
		registryDependencies: [...registryDependencies, 'button'],
		dependencies:
			name === 'tide-forecast'
				? ['lucide-react', '@number-flow/react@^0.5.8']
				: name === 'weather-forecast' || name === 'moon-forecast'
					? ['lucide-react', 'astronomy-engine@2.1.19']
					: ['lucide-react'],
		files
	});
}
items.push({
	$schema: 'https://ui.shadcn.com/schema/registry-item.json',
	name: 'forecast-dashboard',
	type: 'registry:block',
	description: 'Weather and moon for Austin, with a separate coastal tide card.',
	registryDependencies: [
		'https://wxcn.dev/r/react/weather-forecast.json',
		'https://wxcn.dev/r/react/moon-forecast.json',
		'https://wxcn.dev/r/react/tide-forecast.json'
	],
	files: [
		await file(
			'packages/react/src/components/wxcn/forecast-dashboard.tsx',
			'registry:component',
			'@components/wxcn/forecast-dashboard.tsx'
		)
	]
});
export const reactRegistry = {
	$schema: 'https://ui.shadcn.com/schema/registry.json',
	name: 'wxcn',
	homepage: 'https://wxcn.dev/react',
	items
};
