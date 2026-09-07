import endpoints from '../../routes/docs/endpoints/+page.md?raw';
import { load } from './component-docs.js';
import registry from '../../../registry.json';

export const markdownPages = [
	{ path: '/', title: 'wxcn', markdown: '/index.md' },
	{ path: '/docs/components', title: 'Components', markdown: '/docs/components.md' },
	{ path: '/docs/endpoints', title: 'Data sources', markdown: '/docs/endpoints.md' },
	{ path: '/registry', title: 'Registry', markdown: '/registry.md' },
	{ path: '/shader-preview', title: 'Weather background preview', markdown: '/shader-preview.md' }
];

export async function pageMarkdown(path: string, origin: string): Promise<string | null> {
	if (path === '/docs/endpoints') return endpoints;
	const install = (name: string) =>
		`pnpm dlx shadcn-svelte@latest add ${origin}/r/svelte/${name}.json`;
	if (path === '/docs/components') {
		const { examples } = await load();
		return (
			'# Components\n\nTheme-aware weather, moon, and tide cards for shadcn-svelte.\n\n' +
			examples
				.map((item) =>
					[
						`## ${item.title}`,
						item.description,
						'### Usage',
						'```svelte\n' + item.code + '\n```',
						...(item.name === 'weather-forecast'
							? [
									'Pass currentWeather observations separately from forecast periods. showTemperatureTrend adds a sentence about today’s high or tonight’s low. Supply currentWeather.highToday to stop the rise sentence after the high has been reached. showHighLow independently displays arrows. Both default to false and respect unit. Set location.timeZone to the IANA time zone. Pass null when observations are unavailable.'
								]
							: []),
						'### Command installation',
						'```sh\n' + install(item.name) + '\n```',
						'### Manual installation',
						'1. Install the native base components.\n\n```sh\npnpm dlx shadcn-svelte@latest add ' +
							item.primitives.join(' ') +
							'\n```',
						'2. Install dependencies.\n\n```sh\npnpm add ' + item.dependencies.join(' ') + '\n```',
						'3. Copy the following files. These use default aliases and Lucide icons. Adjust imports to match your project, or use the CLI to apply your configuration automatically.',
						...item.files.map(
							(file) =>
								`#### ${file.path}\n\n\`\`\`${file.path.endsWith('.svelte') ? 'svelte' : 'ts'}\n${file.code}\n\`\`\``
						),
						'4. Update import paths to match your project setup.'
					].join('\n\n')
				)
				.join('\n\n')
		);
	}
	if (path === '/registry')
		return (
			'# Registry\n\nSvelte registry items. React and Vue are not implemented yet.\n\n' +
			registry.items
				.map(
					(item) =>
						`## ${item.name}\n\n${item.description}\n\n\`\`\`sh\n${install(item.name)}\n\`\`\`\n\n[Installable JSON](${origin}/r/svelte/${item.name}.json)`
				)
				.join('\n\n')
		);
	if (path === '/')
		return `# wxcn\n\nWeather, moon, and tide components that inherit your shadcn-svelte theme and selected icon library.\n\n## Preview\n\nThe homepage canvas showcases all cards or individual Weather, Moon, and Tides collections in multiple sizes and data densities. Customize native presets, colors, fonts, icons, units, and animated backgrounds. Weather supports optional temperature outlook sentences and high/low arrows. Location permission loads local US weather and the nearest coastal tide station; unavailable location uses labeled Austin fixtures.\n\n## Frameworks\n\nSvelte is available. React and Vue are looking for contributors.\n\n## Get code\n\n\`\`\`sh\n${install('forecast-dashboard')}\n\`\`\`\n\n[Components](${origin}/docs/components.md) · [Data sources](${origin}/docs/endpoints.md) · [Registry](${origin}/registry.md)\n`;
	if (path === '/shader-preview')
		return '# Weather background preview\n\nInteractive preview of WeatherShaderBackground. Select atmospheric modes with the mode query parameter: sunrise, sunset, clear, partly-cloudy, haze, fog, wind, cloudy, thunderstorm, rain, heavy-rain, drizzle, snow, heavy-snow, wintry-mix, clear-night, partly-cloudy-night, and drizzle-night. Backgrounds are included with the weather card registry item.\n';
	return null;
}
