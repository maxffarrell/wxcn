<script lang="ts">
	import { onMount, type ComponentProps, type Snippet } from 'svelte';
	import NumberFlow from '@number-flow/svelte';
	import * as ChartUI from '../ui/chart/index.js';
	import { Chart, Svg, Area } from 'layerchart';
	import { curveMonotoneX } from 'd3-shape';
	import * as Card from '../ui/card/index.js';
	import ForecastScreens from './ForecastScreens.svelte';
	import { forecastDays, type ForecastDay } from '@wxcn/core/forecast-days.js';
	import type {
		ForecastType,
		IconSet,
		LocationInput,
		TidePrediction,
		TideUnit,
		TidePoint,
		TideReading
	} from '@wxcn/core/types.js';
	import { sampleTides, sampleTideSeries, sampleTideTime } from '@wxcn/core/tides.js';
	import { tideState, tideTimestamp } from '@wxcn/core/tide-state.js';
	let {
		interactive = false,
		timeZone,
		type = 'summary',
		size = 'default',
		density = 'comfortable',
		class: className = '',
		unit = 'ft',
		iconType,
		location = {
			label: 'Galveston Pier 21, TX',
			latitude: 29.31,
			longitude: -94.7933,
			station: '8771450',
			timeZone: 'America/Chicago'
		},
		predictions = sampleTides,
		example = predictions === sampleTides,
		series,
		reading = null,
		at,
		sourceLabel = 'Sample tides'
	}: {
		interactive?: boolean;
		timeZone?: string;
		type?: ForecastType;
		size?: 'sm' | 'default' | 'lg';
		density?: 'compact' | 'comfortable';
		class?: string;
		unit?: TideUnit;
		iconType?: IconSet;
		location?: LocationInput;
		predictions?: TidePrediction[];
		example?: boolean;
		series?: TidePoint[];
		reading?: TideReading | null;
		at?: number;
		sourceLabel?: string;
	} = $props();
	let visitorTimeZone = $state('UTC');
	onMount(() => {
		visitorTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	});
	const displayTimeZone = $derived(timeZone ?? location.timeZone ?? visitorTimeZone);
	let clock = $state(Date.now());
	onMount(() => {
		clock = Date.now();
		const timer = setInterval(() => (clock = Date.now()), 60000);
		return () => clearInterval(timer);
	});
	const isSample = $derived(example);
	const now = $derived(at ?? (isSample ? sampleTideTime : clock));
	const tide = $derived(
		tideState(predictions, series ?? (isSample ? sampleTideSeries : []), reading, now)
	);
	const curveData = $derived(
		tide.points.filter((p) => p.time >= now - 12 * 3600000 && p.time <= now + 18 * 3600000)
	);
	// The curve is predicted; observations remain in the headline only.
	const markerTime = $derived(now);
	const chartData = $derived(
		tide.predicted !== null && !curveData.some((p) => p.time === now)
			? [...curveData, { time: now, height: tide.predicted }].toSorted((a, b) => a.time - b.time)
			: curveData
	);
	let chartContext = $state<ComponentProps<typeof Chart>['context']>();
	const hovered = $derived(
		chartContext?.tooltip.data as { time: number; height: number } | null | undefined
	);
	const displayedLevel = $derived(hovered?.height ?? tide.level);
	const displayedTime = $derived(
		hovered?.time ?? (tide.observed ? tideTimestamp(tide.observed.time) : now)
	);
	const indicatorTime = $derived(hovered?.time ?? markerTime);
	const indicatorLevel = $derived(hovered?.height ?? tide.predicted);
	const timeParts = $derived(
		new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			timeZone: displayTimeZone
		}).formatToParts(displayedTime)
	);
	const domain = $derived.by(() => {
		const v = chartData.map((p) => p.height);
		if (tide.level !== null) v.push(tide.level);
		const lo = Math.min(...v),
			hi = Math.max(...v);
		return [lo - Math.max(0.15, (hi - lo) * 0.2), hi + Math.max(0.15, (hi - lo) * 0.2)];
	});
	const height = (value: number) => (value * (unit === 'meter' ? 0.3048 : 1)).toFixed(1);
	const symbol = $derived(unit === 'meter' ? 'm' : 'ft');
	const time = (value: string | number) =>
		new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			timeZone: displayTimeZone
		}).format(typeof value === 'string' ? tideTimestamp(value) : value);
	const dateTime = (p: TidePrediction) =>
		new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			timeZone: displayTimeZone
		}).format(tideTimestamp(p.time));
	const days = $derived(
		forecastDays(
			tide.events
				.filter((p) => tideTimestamp(p.time) >= now && tideTimestamp(p.time) < now + 7 * 86400000)
				.map((p) => ({
					time: tideTimestamp(p.time),
					label: time(p.time),
					summary: `${p.type === 'H' ? 'High' : 'Low'} tide · ${height(Number(p.height))} ${symbol}`,
					details: `Predicted ${p.type === 'H' ? 'high' : 'low'} tide, ${height(Number(p.height))} ${symbol} above MLLW.`
				})),
			displayTimeZone
		)
	);

	let dayChartContext = $state<ComponentProps<typeof Chart>['context']>();
	function pointsForDay(day: ForecastDay) {
		const key = new Intl.DateTimeFormat('en-CA', {
			timeZone: displayTimeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
		return tide.points.filter((point) => key.format(point.time) === day.key);
	}
	function dailyDomain(points: { time: number; height: number }[]) {
		const values = points.map((point) => point.height);
		if (!values.length) return [0, 1];
		const lo = Math.min(...values),
			hi = Math.max(...values),
			padding = Math.max(0.15, (hi - lo) * 0.2);
		return [lo - padding, hi + padding];
	}
</script>

{#snippet cardView(
	day: ForecastDay | undefined,
	action: Snippet<[boolean]>,
	openDay: (time: string, trigger: HTMLElement) => void
)}
	{@const events = day
		? tide.events.filter((event) =>
				day.entries.some((entry) => entry.time === tideTimestamp(event.time))
			)
		: predictions}
	{@const viewNow = day ? day.entries[0].time : now}
	{@const viewTide = day
		? tideState(events, series ?? (isSample ? sampleTideSeries : []), null, viewNow)
		: tide}
	{@const viewChartData = day ? pointsForDay(day) : chartData}
	{@const viewDomain = day ? dailyDomain(viewChartData) : domain}
	{@const viewHovered = day
		? (dayChartContext?.tooltip.data as { time: number; height: number } | undefined)
		: hovered}
	{@const viewDisplayedLevel = day ? (viewHovered?.height ?? viewTide.level) : displayedLevel}
	{@const viewDisplayedTime = day ? (viewHovered?.time ?? viewNow) : displayedTime}
	{@const viewTimeParts = day
		? new Intl.DateTimeFormat('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				timeZone: displayTimeZone
			}).formatToParts(viewDisplayedTime)
		: timeParts}
	{@const viewIndicatorTime = day ? viewDisplayedTime : indicatorTime}
	{@const viewIndicatorLevel = day ? (viewHovered?.height ?? viewTide.predicted) : indicatorLevel}
	<Card.Header
		><Card.Title>{day?.label ?? 'Tides'}</Card.Title><Card.Description
			>{location.label}</Card.Description
		>{@render action(false)}</Card.Header
	>
	<Card.Content class={density === 'compact' ? 'grid gap-3' : 'grid gap-5'}>
		{#if viewTide.events.length || viewTide.points.length}
			<div class={`flex items-end justify-between gap-3 ${day ? '' : 'flex-wrap'}`}>
				<div class="min-w-0">
					<p class={`mb-1 text-xs text-muted-foreground ${day ? 'truncate' : ''}`}>
						{viewHovered
							? 'Predicted water level'
							: !day && isSample
								? 'Example water level'
								: viewTide.observed
									? 'Current water level'
									: viewTide.predicted !== null
										? 'Predicted water level'
										: 'High/low predictions only'}
					</p>
					<p
						style="font-size:clamp(1.5rem,12cqw,2.5rem)"
						class={`${size === 'sm' ? 'text-3xl' : 'text-4xl'} font-medium tracking-tight tabular-nums`}
					>
						{#if viewDisplayedLevel === null}—{:else}<NumberFlow
								value={Number(height(viewDisplayedLevel))}
								format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
							/>{/if}<span class="ml-1 text-sm text-muted-foreground">{symbol}</span>
					</p>
				</div>
				<div class="text-right text-xs text-muted-foreground">
					<p>
						{viewHovered
							? 'Selected time'
							: viewTide.next
								? viewTide.next.type === 'H'
									? 'Rising toward high tide'
									: 'Falling toward low tide'
								: 'Tide outlook'}
					</p>
					<p class="mt-1 tabular-nums" data-slot="tide-time">
						<span class="sr-only">{time(viewDisplayedTime)}</span><span aria-hidden="true"
							>{#each viewTimeParts as part}{#if part.type === 'hour' || part.type === 'minute'}<NumberFlow
										value={Number(part.value)}
										format={{
											minimumIntegerDigits: part.type === 'minute' ? 2 : 1,
											useGrouping: false
										}}
									/>{:else}{part.value}{/if}{/each}</span
						>
					</p>
				</div>
			</div>
			{#if viewChartData.length > 1}
				<ChartUI.Container
					config={{ height: { label: 'Tide level', color: 'var(--chart-1)' } }}
					class={`aspect-auto w-full ${size === 'sm' ? 'h-20' : size === 'lg' ? 'h-36' : 'h-28'}`}
					role="img"
					aria-label="Tide prediction curve with predicted water level marker"
				>
					<Chart
						bind:context={
							() => (day ? dayChartContext : chartContext),
							(value) => {
								if (day) dayChartContext = value;
								else chartContext = value;
							}
						}
						data={viewChartData}
						x="time"
						y="height"
						yDomain={viewDomain}
						series={[{ key: 'height', label: 'Tide level', color: 'var(--chart-1)' }]}
						tooltipContext={{ mode: 'bisect-x' }}
						padding={{ top: 8, right: 8, bottom: 4, left: 8 }}
					>
						{#snippet children({ context })}
							<Svg>
								<Area
									curve={curveMonotoneX}
									fill="color-mix(in oklab, var(--chart-1) 12%, transparent)"
									line={{
										stroke: 'var(--chart-1, var(--primary))',
										strokeWidth: 2,
										fill: 'none',
										opacity: 1
									}}
									motion={{ type: 'tween', duration: 0 }}
								/>
								{#if viewIndicatorLevel !== null && viewIndicatorTime >= viewChartData[0].time && viewIndicatorTime <= viewChartData[viewChartData.length - 1].time}
									<line
										x1={context.xScale(viewIndicatorTime)}
										x2={context.xScale(viewIndicatorTime)}
										y1={0}
										y2={context.height}
										stroke="var(--muted-foreground)"
										stroke-dasharray="3 4"
									/>
									<circle
										data-slot="current-tide-marker"
										cx={context.xScale(viewIndicatorTime)}
										cy={context.yScale(viewIndicatorLevel)}
										r={4.5}
										fill="var(--chart-1, var(--primary))"
										stroke="var(--card)"
										stroke-width="2"
									/>
								{/if}
							</Svg>
						{/snippet}
					</Chart>
				</ChartUI.Container>
				<div class="-mt-2 flex justify-between text-[10px] text-muted-foreground">
					<span>{time(viewChartData[0].time)}</span><span
						>MLLW · {viewTide.points.length ? 'predicted curve' : 'extrema only'}</span
					><span>{time(viewChartData.at(-1)!.time)}</span>
				</div>
			{/if}
			<div class="grid grid-cols-2 gap-3 border-t pt-3">
				{#each [{ label: 'Previous', event: viewTide.previous }, { label: 'Next', event: viewTide.next }] as entry}
					<div>
						<p class="text-xs text-muted-foreground">
							{entry.label}
							{entry.event ? (entry.event.type === 'H' ? 'high tide' : 'low tide') : 'tide'}
						</p>
						<p class="mt-1 text-sm font-medium tabular-nums">
							{entry.event ? time(entry.event.time) : 'Unavailable'}
						</p>
						{#if entry.event}<p class="mt-1 text-xs text-muted-foreground">
								{height(Number(entry.event.height))}
								{symbol}
							</p>{/if}
					</div>
				{/each}
			</div>
			{#if type !== 'simple'}
				<div class="divide-y border-t">
					{#each viewTide.events
						.filter((p) => tideTimestamp(p.time) > viewNow)
						.slice(0, type === 'detailed' ? 6 : density === 'compact' ? 2 : 4) as event}<div
							class={`flex justify-between gap-2 text-xs ${density === 'compact' ? 'py-2' : 'py-3'}`}
						>
							{#if interactive && !day}<button
									type="button"
									class="min-h-8 text-left underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
									aria-label={`View tide details for ${dateTime(event)}`}
									onclick={(e) =>
										openDay(new Date(tideTimestamp(event.time)).toISOString(), e.currentTarget)}
									>{event.type === 'H' ? 'High tide' : 'Low tide'}</button
								>{:else}<span>{event.type === 'H' ? 'High tide' : 'Low tide'}</span>{/if}<span
								class="ml-auto text-muted-foreground">{dateTime(event)}</span
							><span class="tabular-nums">{height(Number(event.height))} {symbol}</span>
						</div>{/each}
				</div>
			{/if}
		{:else}<p role="status" class="py-8 text-center text-sm text-muted-foreground">
				No tide predictions available.
			</p>{/if}
		{#if sourceLabel}<p class="text-[10px] text-muted-foreground">{sourceLabel}</p>{/if}
	</Card.Content>
{/snippet}

<Card.Root
	style="container-type: inline-size"
	size={size === 'sm' ? 'sm' : 'default'}
	data-density={density}
	data-card-size={size}
	class={`relative isolate min-w-0 overflow-hidden ${className}`}
>
	<ForecastScreens
		{interactive}
		{days}
		title="Tide"
		{density}
		{sourceLabel}
		{iconType}
		showWeek={size === 'sm' || type === 'simple'}
	>
		{#snippet children(openDay, action, visible)}
			{@render cardView(undefined, action, openDay)}
		{/snippet}
		{#snippet detail(day, action)}
			{@render cardView(day, action, () => {})}
		{/snippet}
	</ForecastScreens>
</Card.Root>
