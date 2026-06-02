<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import ForecastIcon from '$lib/icons/forecast-icons.svelte';
	import type {
		ForecastType,
		IconSet,
		LocationInput,
		TidePrediction,
		TideUnit
	} from '$lib/data/types.js';
	import { sampleTides } from '$lib/data/tides.js';

	let {
		type = 'summary',
		unit = 'ft',
		iconType = 'lucide',
		location = {
			label: 'Charleston Harbor',
			latitude: 32.781,
			longitude: -79.923,
			station: '8665530'
		},
		predictions = sampleTides,
		sourceLabel = 'NOAA CO-OPS'
	}: {
		type?: ForecastType;
		unit?: TideUnit;
		iconType?: IconSet;
		location?: LocationInput;
		predictions?: TidePrediction[];
		sourceLabel?: string;
	} = $props();

	function tideHeightValue(height: string) {
		const feet = Number.parseFloat(height);
		return unit === 'meter' ? feet * 0.3048 : feet;
	}

	function displayTideHeight(height: string) {
		return tideHeightValue(height).toFixed(unit === 'meter' ? 2 : 2);
	}

	const visible = $derived(
		type === 'simple' ? predictions.slice(0, 2) : predictions.slice(0, 4)
	);
	const nextHigh = $derived(
		visible.find((prediction) => prediction.type === 'H') ?? visible[0]
	);
	const nextLow = $derived(
		visible.find((prediction) => prediction.type === 'L') ??
			visible[1] ??
			visible[0]
	);
	const displayUnitLabel = $derived(unit === 'meter' ? 'm' : 'ft');
	const chart = $derived.by(() => {
		const heights = visible.map((prediction) =>
			tideHeightValue(prediction.height)
		);
		const min = Math.min(...heights);
		const max = Math.max(...heights);
		const range = Math.max(0.1, max - min);
		const points = visible.map((prediction, index) => {
			const x = 24 + (index * 252) / Math.max(1, visible.length - 1);
			const heightValue = tideHeightValue(prediction.height);
			const y = 132 - ((heightValue - min) / range) * 92;
			return {
				...prediction,
				x,
				y,
				label: prediction.time.split(' ')[1] ?? prediction.time,
				heightLabel: displayTideHeight(prediction.height),
				heightValue
			};
		});
		const path = points
			.map((point, index) => {
				if (index === 0) return `M ${point.x} ${point.y}`;
				const previous = points[index - 1];
				const control = (point.x - previous.x) / 2;
				return `C ${previous.x + control} ${previous.y}, ${point.x - control} ${point.y}, ${point.x} ${point.y}`;
			})
			.join(' ');
		const area = `${path} L ${points.at(-1)?.x ?? 276} 144 L ${points[0]?.x ?? 24} 144 Z`;
		return { points, path, area };
	});
</script>

<Card.Root class="wxcn-shell">
	<Card.Content class="space-y-[var(--wxcn-gap)] p-[var(--wxcn-card-padding)]">
		<div class="wxcn-forecast-surface">
			<div class="flex items-start justify-between gap-3">
				<div class="space-y-1">
					<p class="wxcn-title text-xs font-semibold text-background/60">
						Tide Forecast
					</p>
					<h3
						class="flex items-center gap-2 text-base font-semibold tracking-normal"
					>
						<span
							class="flex size-8 items-center justify-center rounded-md border border-background/15 bg-background/10 text-primary shadow-sm"
						>
							<ForecastIcon name="tide" iconSet={iconType} class="size-4" />
						</span>
						{location.label}
					</h3>
				</div>
				<span class="wxcn-chip wxcn-inverted-chip">{sourceLabel}</span>
			</div>

			<div class="mt-4 grid gap-2 sm:grid-cols-2">
				<div
					class="rounded-md border border-background/15 bg-background/10 px-2.5 py-2"
				>
					<p class="wxcn-title text-xs text-background/55">next high</p>
					<p class="mt-0.5 wxcn-tabular text-xl font-semibold">
						{displayTideHeight(nextHigh.height)}<span
							class="text-xs text-background/55"
						>
							{displayUnitLabel}</span
						>
					</p>
					<p class="text-[11px] text-background/65">{nextHigh.time}</p>
				</div>
				<div
					class="rounded-md border border-background/15 bg-background/10 px-2.5 py-2"
				>
					<p class="wxcn-title text-xs text-background/55">next low</p>
					<p class="mt-0.5 wxcn-tabular text-xl font-semibold">
						{displayTideHeight(nextLow.height)}<span
							class="text-xs text-background/55"
						>
							{displayUnitLabel}</span
						>
					</p>
					<p class="text-[11px] text-background/65">{nextLow.time}</p>
				</div>
			</div>

			<div
				class="mt-2 rounded-md border border-background/15 bg-background/10 p-1.5"
			>
				<svg
					class="h-20 w-full overflow-visible"
					viewBox="0 0 300 168"
					role="img"
					aria-label="Smooth tide height chart"
				>
					<defs>
						<linearGradient id="wxcn-tide-fill" x1="0" x2="0" y1="0" y2="1">
							<stop
								offset="0%"
								stop-color="hsl(var(--primary))"
								stop-opacity="0.42"
							/>
							<stop
								offset="100%"
								stop-color="hsl(var(--primary))"
								stop-opacity="0.04"
							/>
						</linearGradient>
					</defs>
					<path
						d="M 18 144 H 282"
						stroke="hsl(var(--background) / 0.16)"
						stroke-width="1"
					/>
					<path
						d="M 18 86 H 282"
						stroke="hsl(var(--background) / 0.10)"
						stroke-width="1"
						stroke-dasharray="4 6"
					/>
					<path d={chart.area} fill="url(#wxcn-tide-fill)" />
					<path
						d={chart.path}
						fill="none"
						stroke="hsl(var(--primary))"
						stroke-linecap="round"
						stroke-width="3"
					/>
					{#each chart.points as point (`${point.time}-${point.type}-chart`)}
						<g>
							<circle
								cx={point.x}
								cy={point.y}
								r="4.5"
								fill="hsl(var(--primary))"
							/>
							<circle
								cx={point.x}
								cy={point.y}
								r="8"
								fill="none"
								stroke="hsl(var(--primary) / 0.24)"
							/>
							<text
								x={point.x}
								y={point.y - 15}
								text-anchor="middle"
								class="fill-background text-[9px] font-medium"
							>
								{point.type === 'H' ? 'High' : 'Low'}
								{point.heightLabel}
								{displayUnitLabel}
							</text>
							<text
								x={point.x}
								y="162"
								text-anchor="middle"
								class="fill-background/55 text-[9px]"
							>
								{point.label}
							</text>
						</g>
					{/each}
				</svg>
			</div>
		</div>

		{#if type === 'detailed'}
			<div class="grid gap-[var(--wxcn-gap)]">
				{#each visible as prediction, index (`${prediction.time}-${prediction.type}`)}
					<div
						class="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border bg-card p-[var(--wxcn-item-padding)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
					>
						<div
							class="flex size-8 items-center justify-center rounded-md border bg-muted text-xs font-semibold text-primary"
						>
							{prediction.type}
						</div>
						<div>
							<div class="flex items-center gap-3">
								<p class="text-sm font-semibold">
									{prediction.type === 'H' ? 'High tide' : 'Low tide'}
								</p>
								<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full bg-primary"
										style={`width: ${prediction.type === 'H' ? 80 - index * 7 : 38 + index * 6}%`}
									></div>
								</div>
							</div>
							<p class="mt-0.5 text-xs text-muted-foreground">
								{prediction.time}
							</p>
							<p class="mt-1 text-xs text-muted-foreground">
								Prediction uses MLLW datum and local station time from NOAA
								CO-OPS.
							</p>
						</div>
						<div class="text-right">
							<p class="wxcn-tabular text-lg font-semibold">
								{displayTideHeight(prediction.height)}
							</p>
							<p class="text-xs text-muted-foreground">{displayUnitLabel}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card.Content>
</Card.Root>
