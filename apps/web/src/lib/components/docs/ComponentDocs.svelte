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
	import { getPage } from '$lib/page.svelte.js';
	const page = getPage();
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
			<p>
				Use <code>background</code> on WeatherForecast or ForecastDashboard:
				<code>"none"</code> (default) keeps the plain card, <code>"realistic"</code>
				animates a photographic cloud texture. Dithered and gradient backgrounds are temporarily disabled
				while their visual design is improved; existing values render a plain card. Realistic backgrounds
				respect reduced motion and pause offscreen.
			</p>
			<H3 id="weather-sky">Location-aware skies</H3>
			<p>
				Backgrounds use <code>location.latitude</code>, <code>location.longitude</code>, and
				<code>at</code> to calculate the Sun and Moon with Astronomy Engine. Live cards update every minute;
				sample cards use their sample date. Day details use the selected period's start time. Sunrise
				and sunset colors follow solar altitude, including nighttime rain, snow, and clouds.
			</p>
			<p>
				The sky is a fixed panorama: north at both edges, east at one quarter, south in the middle,
				west at three quarters. Height follows altitude. Sun and Moon discs are enlarged for
				readability; the Moon shows its calculated illuminated fraction and local tilt, and bodies
				below the horizon are hidden. Clouds can obscure them. This is an illustrative sky, not a
				camera-aligned view or a forecast of exact cloud locations.
			</p>
			<p>
				Pass an explicit <code>at</code> timestamp to preview a moment. The homepage's Sky time picker
				finds actual rise, set, and solar transit times; polar locations may have no sunrise or sunset
				on the preview date.
			</p>
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
				Set <code>timeZone</code> for the local calendar day. The example uses both options with sample
				observations.
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
			restore focus. Weather details use the selected day's conditions for the chosen <code
				>background</code
			>. ForecastDashboard forwards
			<code>interactive</code> to all three cards.
		</p>
		<p>
			Weather and tides show supplied periods only, up to seven days; missing days are not filled
			in. Moon summaries use astronomical phase calculations anchored to the supplied forecast date.
			Set <code>timeZone</code> or <code>location.timeZone</code> to group days in the local calendar.
		</p>
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
