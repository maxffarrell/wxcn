import endpoints from '../pages/Endpoints.svx?raw';
import { load } from './component-docs.js';

export const markdownPages = [
	{ path: '/', title: 'wxcn', markdown: '/index.md' },
	{ path: '/docs/components', title: 'Components', markdown: '/docs/components.md' },
	{ path: '/docs/endpoints', title: 'Data sources', markdown: '/docs/endpoints.md' },
	{ path: '/shader-preview', title: 'Weather background preview', markdown: '/shader-preview.md' },
	{ path: '/react', title: 'wxcn for React', markdown: '/react/index.md' },
	{
		path: '/react/docs/components',
		title: 'React components',
		markdown: '/react/docs/components.md'
	},
	{
		path: '/react/docs/endpoints',
		title: 'React data sources',
		markdown: '/react/docs/endpoints.md'
	}
];

export async function pageMarkdown(path: string, origin: string): Promise<string | null> {
	const framework = path === '/react' || path.startsWith('/react/') ? 'react' : 'svelte';
	const prefix = framework === 'react' ? '/react' : '';
	const pagePath = path.slice(prefix.length) || '/';
	const library = framework === 'react' ? 'shadcn/ui' : 'shadcn-svelte';
	const installer = framework === 'react' ? 'shadcn@latest' : 'shadcn-svelte@latest';
	if (pagePath === '/docs/endpoints') return endpoints;
	const install = (name: string) =>
		`pnpm dlx ${installer} add ${origin}/r/${framework}/${name}.json`;
	if (pagePath === '/docs/components') {
		const { examples } = await load(framework);
		return (
			`# Components\n\nTheme-aware weather, moon, and tide cards for ${library}.\n\n## Time zones\n\nCards default to the visitor browser time zone after hydration (UTC during SSR). Override with the optional IANA timeZone prop, for example timeZone="America/Chicago". ForecastDashboard forwards this prop to every card.\n\n` +
			examples
				.map((item) =>
					[
						`## ${item.title}`,
						item.description,
						'### Usage',
						'```' + (framework === 'react' ? 'tsx' : 'svelte') + '\n' + item.code + '\n```',
						...(item.name === 'weather-forecast'
							? [
									'Pass currentWeather observations separately from forecast periods. showTemperatureTrend adds a sentence about today’s high or tonight’s low. Supply currentWeather.highToday to stop the rise sentence after the high has been reached. showHighLow independently displays arrows. Both default to false and respect unit. Set timeZone to the IANA time zone. Pass null when observations are unavailable.'
								]
							: []),
						'### Command installation',
						'```sh\n' + install(item.name) + '\n```',
						'### Manual installation',
						'1. Install the native base components.\n\n```sh\npnpm dlx ' +
							installer +
							' add ' +
							item.primitives.join(' ') +
							'\n```',
						'2. Install dependencies.\n\n```sh\npnpm add ' + item.dependencies.join(' ') + '\n```',
						'3. Copy the following files. These use default aliases and Lucide icons. Adjust imports to match your project, or use the CLI to apply your configuration automatically.',
						...item.files.map(
							(file) =>
								`#### ${file.path}\n\n\`\`\`${file.path.endsWith('.svelte') ? 'svelte' : file.path.endsWith('.tsx') ? 'tsx' : 'ts'}\n${file.code}\n\`\`\``
						),
						'4. Update import paths to match your project setup.'
					].join('\n\n')
				)
				.join('\n\n')
		);
	}
	if (pagePath === '/')
		return `# wxcn\n\nWeather, moon, and tide components that inherit your ${library} theme and selected icon library.\n\n## Preview\n\nThe homepage canvas showcases all cards or individual Weather, Moon, and Tides collections in multiple sizes and data densities. Customize native presets, colors, fonts, icons, units, and animated backgrounds. Weather supports optional temperature outlook sentences and high/low arrows. Location permission loads local US weather and the nearest coastal tide station; unavailable location uses labeled Austin fixtures.\n\n## Frameworks\n\nSvelte and React are available. Vue is looking for contributors.\n\n## Get code\n\n\`\`\`sh\n${install('forecast-dashboard')}\n\`\`\`\n\n[Components](${origin}${prefix}/docs/components.md) · [Data sources](${origin}${prefix}/docs/endpoints.md)\n`;
	if (path === '/shader-preview')
		return '# Weather background preview\n\nInteractive preview of WeatherShaderBackground. Select atmospheric modes with the mode query parameter: sunrise, sunset, clear, partly-cloudy, haze, fog, wind, cloudy, thunderstorm, rain, heavy-rain, drizzle, snow, heavy-snow, wintry-mix, clear-night, partly-cloudy-night, and drizzle-night. Backgrounds are included with the weather card registry item.\n';
	return null;
}
