<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
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
			label: 'Santa Monica, CA',
			latitude: 34.0195,
			longitude: -118.4912,
			station: '9410840'
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

	const timeFormatter = new Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: '2-digit'
	});

	function tideHeightValue(height: string) {
		const feet = Number.parseFloat(height);
		return unit === 'meter' ? feet * 0.3048 : feet;
	}

	function displayTideHeight(height: string) {
		return tideHeightValue(height).toFixed(1);
	}

	function formatTime(value: string) {
		return timeFormatter.format(new Date(value.replace(' ', 'T')));
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
	const currentTide = $derived(nextHigh);
	const currentTrend = $derived(currentTide.type === 'H' ? 'Rising' : 'Falling');
	const chart = $derived.by(() => {
		const heights = visible.map((prediction) =>
			tideHeightValue(prediction.height)
		);
		const min = Math.min(...heights);
		const max = Math.max(...heights);
		const range = Math.max(0.1, max - min);
		const points = visible.map((prediction, index) => {
			const x = 30 + (index * 260) / Math.max(1, visible.length - 1);
			const heightValue = tideHeightValue(prediction.height);
			const y = 126 - ((heightValue - min) / range) * 84;
			return {
				...prediction,
				x,
				y,
				heightLabel: displayTideHeight(prediction.height)
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
		const area = `${path} L ${points.at(-1)?.x ?? 290} 138 L ${points[0]?.x ?? 30} 138 Z`;
		return { points, path, area };
	});
</script>

<Card.Root class="wxcn-shell wxcn-widget-card">
	<Card.Content class="p-0">
		<div class="wxcn-widget-header">
			<div class="flex items-start gap-3">
				<span class="wxcn-widget-icon text-primary">
					<ForecastIcon name="tide" iconSet={iconType} class="size-5" />
				</span>
				<div>
					<h3 class="text-lg font-semibold leading-none tracking-normal">Tides</h3>
					<p class="mt-1.5 text-sm text-muted-foreground">
						{location.label}
					</p>
				</div>
			</div>
			<span class="text-2xl leading-none text-foreground/80">›</span>
		</div>

		<div class="px-5 pb-5">
			<div class="mt-4">
				<p class="flex items-center gap-2 text-sm font-medium text-primary">
					<span>{currentTrend === 'Rising' ? '↑' : '↓'}</span>
					{currentTrend}
				</p>
				<p class="mt-2 wxcn-tabular text-5xl font-semibold leading-none tracking-normal">
					{displayTideHeight(currentTide.height)}
					<span class="text-3xl">{displayUnitLabel}</span>
				</p>
				<p class="mt-3 text-sm text-muted-foreground">as of 9:41 AM</p>
			</div>

			<div class="mt-5">
				<svg
					class="h-44 w-full overflow-visible"
					viewBox="0 0 340 176"
					role="img"
					aria-label="Smooth tide height chart"
				>
					<defs>
						<linearGradient id="wxcn-tide-fill" x1="0" x2="0" y1="0" y2="1">
							<stop
								offset="0%"
								stop-color="hsl(var(--primary))"
								stop-opacity="0.24"
							/>
							<stop
								offset="100%"
								stop-color="hsl(var(--primary))"
								stop-opacity="0.02"
							/>
						</linearGradient>
					</defs>
					<path
						d="M 28 138 H 294"
						stroke="hsl(var(--border))"
						stroke-width="1"
					/>
					<path
						d="M 28 84 H 294"
						stroke="hsl(var(--border))"
						stroke-dasharray="4 5"
						stroke-width="1"
					/>
					<path d={chart.area} fill="url(#wxcn-tide-fill)" />
					<path
						d={chart.path}
						fill="none"
						stroke="hsl(var(--primary))"
						stroke-linecap="round"
						stroke-width="2.2"
					/>
					<path
						d="M 156 34 V 140"
						stroke="hsl(var(--border))"
						stroke-dasharray="4 5"
					/>
					<circle cx="156" cy="94" r="5.5" fill="hsl(var(--primary))" />
					<text x="308" y="42" class="fill-muted-foreground text-[11px]">
						6 ft
					</text>
					<text x="308" y="84" class="fill-muted-foreground text-[11px]">
						3 ft
					</text>
					<text x="308" y="126" class="fill-muted-foreground text-[11px]">
						0 ft
					</text>
					<text x="308" y="166" class="fill-muted-foreground text-[11px]">
						-3 ft
					</text>
					{#each ['12 AM', '6 AM', '12 PM', '6 PM', '12 AM'] as label, index (`${label}-${index}`)}
						<text
							x={28 + index * 66}
							y="166"
							text-anchor="middle"
							class="fill-muted-foreground text-[11px]"
						>
							{label}
						</text>
					{/each}
				</svg>
			</div>

			<div class="mt-4 divide-y">
				{#each visible as prediction (`${prediction.time}-${prediction.type}`)}
					<div
						class="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-3 py-3 text-sm"
					>
						<span class="text-2xl leading-none text-primary">
							{prediction.type === 'H' ? '↑' : '↓'}
						</span>
						<span class="font-medium">
							{prediction.type === 'H' ? 'High Tide' : 'Low Tide'}
						</span>
						<span class="text-muted-foreground">{formatTime(prediction.time)}</span>
						<span class="wxcn-tabular font-semibold">
							{displayTideHeight(prediction.height)} {displayUnitLabel}
						</span>
					</div>
				{/each}
			</div>

			<div class="mt-5 flex items-center justify-between gap-4">
				<p class="text-sm text-muted-foreground">All times PDT</p>
				<Button variant="outline" class="h-9">
					View 7-Day Tide Chart
					<span class="ml-2 text-xs">↗</span>
				</Button>
			</div>

			{#if type === 'detailed'}
				<p class="mt-4 text-xs leading-5 text-muted-foreground">
					{sourceLabel} predictions use MLLW datum and local station time.
					Next low tide is {displayTideHeight(nextLow.height)} {displayUnitLabel}.
				</p>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
