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
	import ReactForecast from '$lib/components/react-forecast.svelte';
	import { getPage } from '$lib/page.svelte.js';
	const page = getPage();
	const framework = $derived(page.url.pathname.startsWith('/react') ? 'react' : 'svelte');
	const installer = $derived(framework === 'react' ? 'shadcn@latest' : 'shadcn-svelte@latest');
	const reactKinds = {
		'weather-forecast': 'weather',
		'tide-forecast': 'tides',
		'moon-forecast': 'moon',
		'forecast-dashboard': 'dashboard'
	} as const;
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
		<ComponentPreview name={item.name}>
			{#snippet example()}
				{#if framework === 'react'}
					<div class={item.name === 'forecast-dashboard' ? 'w-full' : 'w-full max-w-sm'}>
						<ReactForecast
							kind={reactKinds[item.name as keyof typeof reactKinds]}
							props={item.name === 'weather-forecast'
								? {
										interactive: true,
										unit: 'celsius',
										animatedBackground: true,
										showTemperatureTrend: true,
										showHighLow: true
									}
								: item.name === 'tide-forecast'
									? { interactive: true, unit: 'meter' }
									: item.name === 'forecast-dashboard'
										? { interactive: true, animatedWeatherBackground: true }
										: { interactive: true }}
						/>
					</div>
				{:else}
					{@const Demo = demos[item.name]}
					<Demo />
				{/if}
			{/snippet}
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
				Set an explicit <code>timeZone</code> first; otherwise cards use
				<code>location.timeZone</code>, then the visitor's browser time zone after hydration. Server
				rendering falls back to UTC when neither prop supplies a time zone.
			</p>
		{/if}
		<H3 id={`${item.name}-interaction`}>Interactive forecasts</H3>
		<p>
			Set <code>interactive</code> to enable navigation inside each card; it defaults to
			<code>false</code>. Small and simple cards have a subtle View week action in the top-right
			corner. Weather and tide cards that already display the forecast list open daily details
			directly from each entry. Moon cards offer a weekly phase table.
		</p>
		<p>
			Day details reuse the original card layout with the selected day's data, preserving its
			dimensions without an internal scroll area. Week tables page through the available days when
			the card is too small to show them all. Back and Escape return to the previous screen and
			restore focus. Weather details use the selected day's animated background when <code
				>animatedBackground</code
			>
			is enabled. ForecastDashboard forwards
			<code>interactive</code> to all three cards.
		</p>
		<p>
			Weather and tides show supplied periods only, up to seven days; missing days are not filled
			in. Moon summaries use the existing lunar estimates anchored to the supplied forecast date.
			Set <code>timeZone</code> or <code>location.timeZone</code> to group days in the local calendar.
		</p>
		<H3 id={`${item.name}-installation`}>Installation</H3>
		<InstallTabs>
			{#snippet cli()}<PMBlock
					type="execute"
					command={[installer, 'add', `${page.url.origin}/r/${framework}/${item.name}.json`]}
				/>{/snippet}
			{#snippet manual()}
				<Steps>
					<Step>Install the required base components.</Step>
					<PMBlock type="execute" command={[installer, 'add', ...item.primitives]} />
					{#if item.dependencies.length}<Step>Install the following dependencies.</Step><PMBlock
							type="add"
							command={item.dependencies}
						/>{/if}
					<Step>Copy and paste the following code into your project.</Step>
					<p>
						These files use the default aliases and native icon adapter. Adjust imports to match
						your project, or use CLI installation to apply your aliases and configured icon library
						automatically.
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
