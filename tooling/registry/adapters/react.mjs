import { readFile } from 'node:fs/promises';
const root = new URL('../../../', import.meta.url);
async function file(path, type, target) {
	const content = (await readFile(new URL(path, root), 'utf8')).replaceAll(
		'@wxcn/core/',
		'@/lib/wxcn/'
	);
	return { path, type, target, content };
}
const definitions = [
	[
		'weather-forecast',
		'Weather forecast with optional atmospheric backgrounds.',
		['weather', 'weather-outlook'],
		['weather-shader-background'],
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
		...[name, ...components].map((name) =>
			file(
				`packages/react/src/components/wxcn/${name}.tsx`,
				'registry:component',
				`@components/wxcn/${name}.tsx`
			)
		),
		...['types', ...helpers].map((name) =>
			file(`packages/core/src/${name}.ts`, 'registry:lib', `@lib/wxcn/${name}.ts`)
		)
	]);
	items.push({
		$schema: 'https://ui.shadcn.com/schema/registry-item.json',
		name,
		type: 'registry:component',
		description,
		registryDependencies,
		dependencies: ['lucide-react'],
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
