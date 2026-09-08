<script setup lang="ts">
import {
	computed,
	defineComponent,
	h,
	onBeforeUnmount,
	onMounted,
	ref,
	type PropType,
	type VNode,
	type VNodeRef
} from 'vue';
import NumberFlow from '@number-flow/vue';
import { area as shapeArea, curveMonotoneX, line as shapeLine } from 'd3-shape';
import { forecastDays, type ForecastDay } from '@wxcn/core/forecast-days.js';
import { sampleTideSeries, sampleTideTime, sampleTides } from '@wxcn/core/tides.js';
import { tideState, tideTimestamp } from '@wxcn/core/tide-state.js';
import type {
	ForecastType,
	LocationInput,
	TidePoint,
	TidePrediction,
	TideReading,
	TideUnit
} from '@wxcn/core/types.js';
import type { IconSet } from '../../icons/ForecastIcon.vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import ForecastScreens from './ForecastScreens.vue';

type Point = { time: number; height: number };
type OpenDay = (time: string, trigger: HTMLElement) => void;
const props = withDefaults(
	defineProps<{
		interactive?: boolean;
		iconType?: IconSet;
		timeZone?: string;
		type?: ForecastType;
		size?: 'sm' | 'default' | 'lg';
		density?: 'compact' | 'comfortable';
		class?: string;
		unit?: TideUnit;
		location?: LocationInput;
		predictions?: TidePrediction[];
		example?: boolean;
		series?: TidePoint[];
		reading?: TideReading | null;
		at?: number;
		sourceLabel?: string;
	}>(),
	{
		interactive: false,
		type: 'summary',
		size: 'default',
		density: 'comfortable',
		class: '',
		unit: 'ft',
		location: () => ({
			label: 'Galveston Pier 21, TX',
			latitude: 29.31,
			longitude: -94.7933,
			station: '8771450',
			timeZone: 'America/Chicago'
		}),
		predictions: () => sampleTides,
		reading: null,
		sourceLabel: 'Sample tides'
	}
);
const visitor = ref('UTC'),
	clock = ref<number | null>(null),
	hovered = ref<Point | null>(null),
	dayHovered = ref<Point | null>(null);
let timer: number | undefined;
onMounted(() => {
	visitor.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
	clock.value = Date.now();
	timer = window.setInterval(() => (clock.value = Date.now()), 60_000);
});
onBeforeUnmount(() => clearInterval(timer));
const zone = computed(() => props.timeZone ?? props.location.timeZone ?? visitor.value),
	sample = computed(() => props.example ?? props.predictions === sampleTides),
	now = computed(() => props.at ?? (sample.value ? sampleTideTime : (clock.value ?? 0)));
const tide = computed(() =>
	tideState(
		props.predictions,
		props.series ?? (sample.value ? sampleTideSeries : []),
		props.reading,
		now.value
	)
);
const symbol = computed(() => (props.unit === 'meter' ? 'm' : 'ft')),
	level = (n: number) => (n * (props.unit === 'meter' ? 0.3048 : 1)).toFixed(1);
const time = (v: string | number) =>
	new Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		timeZone: zone.value
	}).format(typeof v === 'string' ? tideTimestamp(v) : v);
const dateTime = (v: string) =>
	new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		timeZone: zone.value
	}).format(tideTimestamp(v));
const chartData = computed<Point[]>(() => {
	const data = tide.value.points.filter(
		(p) => p.time >= now.value - 12 * 36e5 && p.time <= now.value + 18 * 36e5
	);
	return tide.value.predicted !== null && !data.some((p) => p.time === now.value)
		? [...data, { time: now.value, height: tide.value.predicted }].sort((a, b) => a.time - b.time)
		: data;
});
const days = computed(() =>
	forecastDays(
		tide.value.events
			.filter((e) => {
				const t = tideTimestamp(e.time);
				return t >= now.value && t < now.value + 7 * 864e5;
			})
			.map((e) => ({
				time: tideTimestamp(e.time),
				label: time(e.time),
				summary: `${e.type === 'H' ? 'High' : 'Low'} tide · ${level(+e.height)} ${symbol.value}`,
				details: `Predicted ${e.type === 'H' ? 'high' : 'low'} tide, ${level(+e.height)} ${symbol.value} above MLLW.`
			})),
		zone.value
	)
);
function pointsForDay(day: ForecastDay) {
	const key = new Intl.DateTimeFormat('en-CA', {
		timeZone: zone.value,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
	return tide.value.points.filter((p) => key.format(p.time) === day.key);
}
function domain(data: Point[], extra: number | null = null): [number, number] {
	const v = data.map((p) => p.height);
	if (extra !== null) v.push(extra);
	if (!v.length) return [0, 1];
	const lo = Math.min(...v),
		hi = Math.max(...v),
		pad = Math.max(0.15, (hi - lo) * 0.2);
	return [lo - pad, hi + pad];
}

const TideView = defineComponent({
	props: {
		day: Object as PropType<ForecastDay>,
		openDay: Function as PropType<OpenDay>,
		action: Function as PropType<() => VNode | null>
	},
	setup(p) {
		const chartSize = ref({ width: 320, height: 112 });
		let chartObserver: ResizeObserver | undefined;
		const setChartElement: VNodeRef = (value) => {
			const element = value instanceof SVGSVGElement ? value : null;
			chartObserver?.disconnect();
			if (!element) return;
			const measure = () => {
				const bounds = element.getBoundingClientRect();
				if (
					bounds.width > 0 &&
					bounds.height > 0 &&
					(Math.abs(bounds.width - chartSize.value.width) > 0.1 ||
						Math.abs(bounds.height - chartSize.value.height) > 0.1)
				) {
					chartSize.value = { width: bounds.width, height: bounds.height };
				}
			};
			chartObserver = new ResizeObserver(measure);
			chartObserver.observe(element);
			measure();
		};
		onBeforeUnmount(() => chartObserver?.disconnect());
		return () => {
			const day = p.day,
				events = day
					? tide.value.events.filter((e) =>
							day.entries.some((x) => x.time === tideTimestamp(e.time))
						)
					: props.predictions,
				viewNow = day ? day.entries[0].time : now.value,
				viewTide = day
					? tideState(events, props.series ?? (sample.value ? sampleTideSeries : []), null, viewNow)
					: tide.value,
				data = day ? pointsForDay(day) : chartData.value,
				hover = day ? dayHovered : hovered,
				selected =
					hover.value && data.some((x) => x.time === hover.value?.time) ? hover.value : null,
				displayLevel = selected?.height ?? viewTide.level,
				displayTime =
					selected?.time ??
					(day ? viewNow : viewTide.observed ? tideTimestamp(viewTide.observed.time) : now.value),
				indicatorTime = selected?.time ?? (day ? displayTime : now.value),
				indicatorLevel = selected?.height ?? viewTide.predicted,
				d = domain(data, day ? null : tide.value.level),
				W = chartSize.value.width,
				H = chartSize.value.height,
				x0 = data[0]?.time ?? 0,
				x1 = data.at(-1)?.time ?? 1,
				x = (v: number) => 8 + ((v - x0) / (x1 - x0 || 1)) * (W - 16),
				y = (v: number) => 8 + ((d[1] - v) / (d[1] - d[0] || 1)) * (H - 12);
			const path =
				shapeLine<Point>()
					.x((point) => x(point.time))
					.y((point) => y(point.height))
					.curve(curveMonotoneX)(data) ?? '';
			const fillPath =
				shapeArea<Point>()
					.x((point) => x(point.time))
					.y0(H)
					.y1((point) => y(point.height))
					.curve(curveMonotoneX)(data) ?? '';
			function nearest(clientX: number, svg: SVGSVGElement) {
				const r = svg.getBoundingClientRect(),
					position = Math.max(0, Math.min(1, (clientX - r.left - 8) / Math.max(1, r.width - 16))),
					t = x0 + position * (x1 - x0);
				hover.value = data.reduce((a, b) => (Math.abs(b.time - t) < Math.abs(a.time - t) ? b : a));
			}
			function key(e: KeyboardEvent) {
				if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(e.key)) return;
				e.preventDefault();
				if (e.key === 'Escape') {
					hover.value = null;
					return;
				}
				let i = hover.value
					? data.findIndex((q) => q.time === hover.value?.time)
					: e.key === 'ArrowLeft' || e.key === 'End'
						? data.length - 1
						: 0;
				if (e.key === 'ArrowLeft') i--;
				if (e.key === 'ArrowRight') i++;
				if (e.key === 'Home') i = 0;
				if (e.key === 'End') i = data.length - 1;
				hover.value = data[Math.max(0, Math.min(data.length - 1, i))];
			}
			const parts = new Intl.DateTimeFormat('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				timeZone: zone.value
			}).formatToParts(displayTime);
			const headline = h(
				'div',
				{ class: `flex items-end justify-between gap-3 ${day ? '' : 'flex-wrap'}` },
				[
					h('div', { class: 'min-w-0' }, [
						h(
							'p',
							{ class: `mb-1 text-xs text-muted-foreground ${day ? 'truncate' : ''}` },
							selected
								? 'Predicted water level'
								: !day && sample.value
									? 'Example water level'
									: viewTide.observed
										? 'Current water level'
										: viewTide.predicted !== null
											? 'Predicted water level'
											: 'High/low predictions only'
						),
						h(
							'p',
							{
								style:
									props.size === 'sm'
										? { fontSize: 'clamp(1.25rem, 8cqw, 1.875rem)', lineHeight: '1.1' }
										: { fontSize: 'clamp(1.5rem, 12cqw, 2.5rem)' },
								class: `${props.size === 'sm' ? 'text-3xl' : 'text-4xl'} font-medium tracking-tight tabular-nums`
							},
							[
								displayLevel === null
									? '—'
									: h(NumberFlow, {
											value: +level(displayLevel),
											format: { minimumFractionDigits: 1, maximumFractionDigits: 1 }
										}),
								h('span', { class: 'ml-1 text-sm text-muted-foreground' }, symbol.value)
							]
						)
					]),
					h('div', { class: 'text-right text-xs text-muted-foreground' }, [
						h(
							'p',
							selected
								? 'Selected time'
								: viewTide.next
									? viewTide.next.type === 'H'
										? 'Rising toward high tide'
										: 'Falling toward low tide'
									: 'Tide outlook'
						),
						h('p', { class: 'mt-1 tabular-nums', 'data-slot': 'tide-time' }, [
							h('span', { class: 'sr-only' }, time(displayTime)),
							h(
								'span',
								{ 'aria-hidden': 'true' },
								parts.map((part, i) =>
									part.type === 'hour' || part.type === 'minute'
										? h(NumberFlow, {
												key: i,
												value: +part.value,
												format: {
													minimumIntegerDigits: part.type === 'minute' ? 2 : 1,
													useGrouping: false
												}
											})
										: part.value
								)
							)
						])
					])
				]
			);
			const graph =
				data.length > 1
					? h('div', [
							h('div', { class: 'relative' }, [
								h(
									'svg',
									{
										ref: setChartElement,
										viewBox: `0 0 ${W} ${H}`,
										preserveAspectRatio: 'none',
										class: `aspect-auto w-full overflow-visible ${props.size === 'sm' ? 'h-16' : props.size === 'lg' ? 'h-36' : 'h-28'}`,
										role: 'img',
										tabindex: 0,
										'aria-label':
											'Tide prediction curve with predicted water level marker. Use arrow keys to inspect points.',
										onPointermove: (e: PointerEvent) =>
											nearest(e.clientX, e.currentTarget as SVGSVGElement),
										onPointerleave: () => (hover.value = null),
										onFocus: () => {
											if (!hover.value)
												hover.value = data.reduce((a, b) =>
													Math.abs(b.time - indicatorTime) < Math.abs(a.time - indicatorTime)
														? b
														: a
												);
										},
										onBlur: () => (hover.value = null),
										onKeydown: key
									},
									[
										[0.25, 0.5, 0.75].map((r) =>
											h('line', {
												x1: 8,
												x2: W - 8,
												y1: H * r,
												y2: H * r,
												stroke: 'var(--border)',
												'stroke-dasharray': '3 4',
												'vector-effect': 'non-scaling-stroke'
											})
										),
										h('path', {
											d: fillPath,
											fill: 'var(--chart-1, var(--primary))',
											opacity: 0.12
										}),
										h('path', {
											d: path,
											fill: 'none',
											stroke: 'var(--chart-1, var(--primary))',
											'stroke-width': 2,
											'vector-effect': 'non-scaling-stroke'
										}),
										indicatorLevel !== null && indicatorTime >= x0 && indicatorTime <= x1
											? h('g', [
													h('line', {
														x1: x(indicatorTime),
														x2: x(indicatorTime),
														y1: 0,
														y2: H,
														stroke: 'var(--muted-foreground)',
														'stroke-dasharray': '3 4',
														'vector-effect': 'non-scaling-stroke'
													}),
													h('circle', {
														'data-slot': 'current-tide-marker',
														cx: x(indicatorTime),
														cy: y(indicatorLevel),
														r: 4.5,
														fill: 'var(--chart-1, var(--primary))',
														stroke: 'var(--card)',
														'stroke-width': 2,
														'vector-effect': 'non-scaling-stroke'
													})
												])
											: null
									]
								),
								selected
									? h(
											'div',
											{
												class:
													'pointer-events-none absolute top-1 z-10 rounded-md border bg-background px-2 py-1 text-[10px] shadow-sm',
												style: {
													left: `${(x(selected.time) / W) * 100}%`,
													transform:
														x(selected.time) > 720
															? 'translateX(-100%)'
															: x(selected.time) < 280
																? 'none'
																: 'translateX(-50%)'
												},
												role: 'status'
											},
											[
												h('p', { class: 'font-medium' }, time(selected.time)),
												h('p', `${level(selected.height)} ${symbol.value}`)
											]
										)
									: null
							]),
							h(
								'div',
								{
									class: `flex justify-between gap-1 text-[10px] text-muted-foreground ${props.size === 'sm' ? '' : '-mt-2'}`
								},
								[
									h('span', time(data[0].time)),
									props.size !== 'sm'
										? h(
												'span',
												`MLLW · ${viewTide.points.length ? 'predicted curve' : 'extrema only'}`
											)
										: null,
									h('span', time(data.at(-1)!.time))
								]
							)
						])
					: null;
			const neighbors = h(
				'div',
				{
					'data-slot': 'tide-neighbors',
					class:
						props.size === 'sm'
							? 'grid content-center gap-3'
							: 'grid grid-cols-2 gap-3 border-t pt-3'
				},
				[
					{ label: 'Previous', event: viewTide.previous },
					{ label: 'Next', event: viewTide.next }
				].map(({ label: caption, event }) =>
					h('div', { key: caption }, [
						h(
							'p',
							{
								class:
									props.size === 'sm'
										? 'text-[10px] text-muted-foreground'
										: 'text-xs text-muted-foreground'
							},
							`${caption} ${event ? (event.type === 'H' ? 'high tide' : 'low tide') : 'tide'}`
						),
						h(
							'div',
							{
								class:
									props.size === 'sm' ? 'mt-0.5 flex flex-wrap items-baseline gap-x-2' : 'contents'
							},
							[
								h(
									'p',
									{
										class:
											props.size === 'sm'
												? 'text-xs font-medium tabular-nums'
												: 'mt-1 text-sm font-medium tabular-nums'
									},
									event ? time(event.time) : 'Unavailable'
								),
								event
									? h(
											'p',
											{
												class:
													props.size === 'sm'
														? 'text-[10px] text-muted-foreground'
														: 'mt-1 text-xs text-muted-foreground'
											},
											`${level(+event.height)} ${symbol.value}`
										)
									: null
							]
						)
					])
				)
			);
			const list =
				props.type !== 'simple'
					? h(
							'div',
							{ class: 'divide-y border-t' },
							viewTide.events
								.filter((e) => tideTimestamp(e.time) > viewNow)
								.slice(0, props.type === 'detailed' ? 6 : props.density === 'compact' ? 2 : 4)
								.map((e) =>
									h(
										'div',
										{
											key: `${e.time}-${e.type}`,
											class: `grid grid-cols-[auto_1fr_auto] items-center gap-3 text-xs ${props.density === 'compact' ? 'py-2' : 'py-3'}`
										},
										[
											h('span', e.type === 'H' ? 'High tide' : 'Low tide'),
											h('span', { class: 'ml-auto text-muted-foreground' }, dateTime(e.time)),
											h('span', { class: 'tabular-nums' }, `${level(+e.height)} ${symbol.value}`)
										]
									)
								)
						)
					: null;
			return [
				h(
					CardHeader,
					{ class: props.size === 'sm' ? 'flex items-baseline justify-between gap-2' : undefined },
					{
						default: () => [
							h(CardTitle, null, { default: () => day?.label ?? 'Tides' }),
							h(CardDescription, null, { default: () => props.location.label }),
							p.action?.()
						]
					}
				),
				h(
					CardContent,
					{
						class: props.size === 'sm' || props.density === 'compact' ? 'grid gap-3' : 'grid gap-5'
					},
					{
						default: () =>
							viewTide.events.length || viewTide.points.length
								? [
										headline,
										h(
											'div',
											{
												'data-slot': 'tide-chart-layout',
												class:
													props.size === 'sm'
														? 'grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3'
														: 'contents'
											},
											[
												props.size === 'sm' ? neighbors : null,
												h(
													'div',
													{ class: props.size === 'sm' ? 'grid min-w-0 gap-1' : 'contents' },
													[graph]
												)
											]
										),
										props.size !== 'sm' ? neighbors : null,
										list,
										!day && props.sourceLabel
											? h('p', { class: 'text-[10px] text-muted-foreground' }, props.sourceLabel)
											: null
									]
								: [
										h(
											'p',
											{ role: 'status', class: 'py-8 text-center text-sm text-muted-foreground' },
											'No tide predictions available.'
										),
										!day && props.sourceLabel
											? h('p', { class: 'text-[10px] text-muted-foreground' }, props.sourceLabel)
											: null
									]
					}
				)
			];
		};
	}
});
const loading = computed(
	() =>
		!sample.value &&
		(props.predictions.length > 0 || (props.series?.length ?? 0) > 0) &&
		props.at === undefined &&
		clock.value === null
);
</script>
<template>
	<Card
		style="container-type: inline-size"
		:data-density="density"
		:data-card-size="size"
		:data-size="size === 'sm' ? 'sm' : 'default'"
		:class="['relative isolate min-w-0 overflow-hidden', props.class]"
	>
		<template v-if="loading"
			><CardHeader
				><CardTitle>Tides</CardTitle
				><CardDescription>{{ location.label }}</CardDescription></CardHeader
			><CardContent
				><p role="status" class="py-8 text-center text-sm text-muted-foreground">
					Loading current tide time…
				</p></CardContent
			></template
		>
		<ForecastScreens
			v-else
			:interactive="interactive"
			:days="days"
			title="Tide"
			:density="density"
			:source-label="sourceLabel"
			:icon-type="iconType"
			show-week
			action-label="Upcoming tides"
			has-summary
		>
			<template #overview="{ openDay, action }"
				><TideView :open-day="openDay" :action="action" /></template
			><template #detail="{ day, action }"><TideView :day="day" :action="action" /></template>
			<template #summary="{ height: availableHeight }"
				><div
					class="grid h-full w-full overflow-y-auto"
					:style="{ gridAutoRows: `minmax(${size === 'lg' ? 40 : 36}px, 1fr)` }"
					data-slot="upcoming-tides"
				>
					<div
						v-for="event in tide.events
							.filter((e) => tideTimestamp(e.time) >= now)
							.slice(0, size === 'lg' ? 12 : Math.max(1, Math.floor(availableHeight / 36)))"
						:key="`${event.time}-${event.type}`"
						:class="[
							'grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3 border-b last:border-0',
							size === 'lg' ? 'text-sm' : 'text-xs'
						]"
					>
						<span class="font-medium">{{ event.type === 'H' ? 'High tide' : 'Low tide' }}</span>
						<time
							:datetime="new Date(tideTimestamp(event.time)).toISOString()"
							class="text-right text-muted-foreground"
							>{{ dateTime(event.time) }}</time
						>
						<span class="text-right tabular-nums">{{ level(+event.height) }} {{ symbol }}</span>
					</div>
					<p
						v-if="!tide.events.some((event) => tideTimestamp(event.time) >= now)"
						class="py-4 text-sm text-muted-foreground"
					>
						No upcoming tide predictions available.
					</p>
				</div></template
			>
		</ForecastScreens>
	</Card>
</template>
