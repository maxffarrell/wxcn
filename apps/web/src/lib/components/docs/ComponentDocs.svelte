<script lang="ts">
	import H2 from '$lib/components/mdsx/h2.svelte';
	import H3 from '$lib/components/mdsx/h3.svelte';
	import ComponentPreview from '$lib/components/component-preview.svelte';
	import InstallTabs from '$lib/components/install-tabs.svelte';
	import Steps from '$lib/components/steps.svelte';
	import Step from '$lib/components/step.svelte';
	import PMBlock from '$lib/components/site/pm-block.svelte';
	import ComponentSource from '$lib/components/component-source.svelte';
	import SourceCode from '$lib/components/docs/SourceCode.svelte';
	import WeatherForecast from '$lib/components/docs/examples/weather-forecast.svelte';
	import TideForecast from '$lib/components/docs/examples/tide-forecast.svelte';
	import MoonForecast from '$lib/components/docs/examples/moon-forecast.svelte';
	import ForecastDashboard from '$lib/components/docs/examples/forecast-dashboard.svelte';
	import { page } from '$app/state';
	let { data }: { data: Awaited<ReturnType<typeof import('$lib/server/component-docs.js').load>> } =
		$props();
	const demos: Record<string, typeof WeatherForecast> = {
		'weather-forecast': WeatherForecast,
		'tide-forecast': TideForecast,
		'moon-forecast': MoonForecast,
		'forecast-dashboard': ForecastDashboard
	};
</script>

{#each data.examples as item}
	<section class="mt-12">
		<H2 id={item.name}>{item.title}</H2>
		<p>{item.description}</p>
		<ComponentPreview name={item.name} component={demos[item.name]}>
			<SourceCode code={item.code} html={item.html} />
		</ComponentPreview>
		{#if item.name === 'weather-forecast'}
			<H3 id="weather-temperature-outlook">Current conditions and temperature outlook</H3>
			<p>
				Pass a <code>currentWeather</code> observation separately from <code>forecast</code>
				periods. The main temperature always shows the observation. If it is unavailable, pass
				<code>null</code>.
			</p>
			<p>
				<code>showTemperatureTrend</code> adds the daytime high or tonight's low as a sentence.
				Provide <code>currentWeather.highToday</code> to stop the upward sentence after the high has
				been reached. <code>showHighLow</code> independently shows high and low arrows using your
				project's icon library. Both props default to <code>false</code> and respect
				<code>unit</code>.
			</p>
			<p>
				Set <code>location.timeZone</code> for the local calendar day. The example uses both options with
				sample observations.
			</p>
		{/if}
		<H3 id={`${item.name}-installation`}>Installation</H3>
		<InstallTabs>
			{#snippet cli()}<PMBlock
					type="execute"
					command={['shadcn-svelte@latest', 'add', `${page.url.origin}/r/svelte/${item.name}.json`]}
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
					<ComponentSource
						item={{
							name: `source-${item.name}`,
							files: item.files.map((file) => ({
								target: file.path,
								type: 'registry:component',
								content: file.code,
								highlightedContent: file.html
							}))
						}}
					/>
					<Step>Update the import paths to match your project setup.</Step>
					<p>
						Use the example above to compose the component. Unit, size, density, and data props are
						optional; omitted data uses labeled fixtures.
					</p>
				</Steps>
			{/snippet}
		</InstallTabs>
	</section>
{/each}
