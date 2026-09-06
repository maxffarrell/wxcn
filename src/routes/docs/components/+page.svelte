<script lang="ts">
	import DocsLayout from '../../../blueprints/docs/blueprint.svelte';
	import ComponentPreview from '$lib/components/component-preview.svelte';
	import InstallTabs from '$lib/components/install-tabs.svelte';
	import Steps from '$lib/components/steps.svelte';
	import Step from '$lib/components/step.svelte';
	import PMBlock from '$lib/components/site/pm-block.svelte';
	import SourceCode from '$lib/components/docs/SourceCode.svelte';
	import WeatherForecast from '$lib/components/docs/examples/weather-forecast.svelte';
	import TideForecast from '$lib/components/docs/examples/tide-forecast.svelte';
	import MoonForecast from '$lib/components/docs/examples/moon-forecast.svelte';
	import ForecastDashboard from '$lib/components/docs/examples/forecast-dashboard.svelte';
	import { page } from '$app/state';
	let { data } = $props();
	const demos: Record<string, typeof WeatherForecast> = {
		'weather-forecast': WeatherForecast,
		'tide-forecast': TideForecast,
		'moon-forecast': MoonForecast,
		'forecast-dashboard': ForecastDashboard
	};
</script>

<DocsLayout>
	<h1>Components</h1>
	<p>
		Weather, moon, and tide components that inherit your shadcn-svelte theme, base components, and
		icon library.
	</p>
	{#each data.examples as item}
		<section id={item.name} class="mt-12">
			<h2>{item.title}</h2>
			<p>{item.description}</p>
			<ComponentPreview name={item.name} component={demos[item.name]}>
				<SourceCode code={item.code} html={item.html} />
			</ComponentPreview>
			<h3>Installation</h3>
			<InstallTabs>
				{#snippet cli()}<PMBlock
						type="execute"
						command={['shadcn-svelte@latest', 'add', `${page.url.origin}/r/${item.name}.json`]}
					/>{/snippet}
				{#snippet manual()}
					<Steps>
						<Step>Install the required base components.</Step>
						<PMBlock type="execute" command={['shadcn-svelte@latest', 'add', ...item.primitives]} />
						{#if item.dependencies.length}<Step>Install the following dependencies.</Step><PMBlock
								type="add"
								command={item.dependencies}
							/>{/if}
						<Step>Copy and paste the following code into your project.</Step>
						<p>
							These files use the default aliases and Lucide icons. Adjust imports to match your
							project, or use CLI installation to apply your configuration automatically.
						</p>
						{#each item.files as file}<details class="my-4 rounded-xl border">
								<summary class="cursor-pointer px-4 py-3 font-mono text-xs">{file.path}</summary
								><SourceCode code={file.code} html={file.html} />
							</details>{/each}
						<Step>Update the import paths to match your project setup.</Step>
						<p>
							Use the example above to compose the component. Unit, size, density, and data props
							are optional; omitted data uses labeled fixtures.
						</p>
					</Steps>
				{/snippet}
			</InstallTabs>
		</section>
	{/each}
</DocsLayout>
