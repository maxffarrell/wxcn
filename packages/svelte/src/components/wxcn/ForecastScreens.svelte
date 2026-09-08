<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import * as Card from '../ui/card/index.js';
	import { Button } from '../ui/button/index.js';
	import ForecastIcon from '../../icons/forecast-icons.svelte';
	import type { IconSet } from '@wxcn/core/types.js';
	import type { ForecastDay } from '@wxcn/core/forecast-days.js';
	let {
		interactive,
		days,
		title,
		summary,
		daySummary,
		actionLabel = 'View week',
		summaryTitle = 'Upcoming tides',
		showWeek = true,
		iconType,
		flush = false,
		detail,
		children
	}: {
		interactive: boolean;
		days: ForecastDay[];
		title: string;
		density: string;
		sourceLabel: string;
		summary?: Snippet<[number]>;
		daySummary?: Snippet<[ForecastDay]>;
		actionLabel?: string;
		summaryTitle?: string;
		showWeek?: boolean;
		iconType?: IconSet;
		flush?: boolean;
		detail: Snippet<[ForecastDay, Snippet<[boolean]>]>;
		children: Snippet<[(time: string, trigger: HTMLElement) => void, Snippet<[boolean]>, boolean]>;
	} = $props();
	let screen = $state<'overview' | 'week' | 'day'>('overview');
	let selectedKey = $state('');
	let fromWeek = false;
	let originIndex = 0;
	let host: HTMLElement | undefined;
	let surface = $state<HTMLDivElement>();
	let availableHeight = $state(0);
	const selected = $derived(days.find((day) => day.key === selectedKey));
	$effect(() => {
		if (!interactive || (screen === 'day' && !selected)) screen = 'overview';
	});
	function measure(node: HTMLElement) {
		const update = () => {
			availableHeight = node.clientHeight;
		};
		const observer = new ResizeObserver(update);
		observer.observe(node);
		update();
		return { destroy: () => observer.disconnect() };
	}
	async function open(next: 'week' | 'day', trigger: HTMLElement, key = '') {
		if (screen === 'overview') {
			host = trigger.closest<HTMLElement>('[data-slot=card]') ?? undefined;
			if (host)
				originIndex = [...host.querySelectorAll('button')].indexOf(trigger as HTMLButtonElement);
		}
		fromWeek = screen === 'week';
		selectedKey = key;
		screen = next;
		await tick();
		surface?.focus({ preventScroll: true });
	}
	function openDay(time: string, trigger: HTMLElement) {
		const day = days.find((day) => day.entries.some((entry) => entry.time === Date.parse(time)));
		if (day) void open('day', trigger, day.key);
	}
	async function back() {
		if (screen === 'day' && fromWeek) {
			screen = 'week';
			await tick();
			host
				?.querySelector<HTMLButtonElement>(`[data-forecast-day="${selectedKey}"]`)
				?.focus({ preventScroll: true });
		} else {
			screen = 'overview';
			await tick();
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
			host?.querySelectorAll<HTMLButtonElement>('button')[originIndex]?.focus({
				preventScroll: true
			});
		}
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape' && screen !== 'overview' && host?.contains(document.activeElement)) {
			event.preventDefault();
			void back();
		}
	}}
/>

{#snippet weekAction(onSurface: boolean)}
	{#if interactive && showWeek}<Card.Action
			><Button
				variant="ghost"
				size="sm"
				class={`h-6 px-1.5 text-[10px] font-medium ${onSurface ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
				aria-label={summary ? actionLabel : `View ${title.toLowerCase()} week`}
				onclick={(event) => open('week', event.currentTarget)}>{actionLabel}</Button
			></Card.Action
		>{/if}
{/snippet}
{#snippet backAction(onSurface: boolean)}
	<Card.Action
		><Button
			variant="ghost"
			size="sm"
			class={`h-6 gap-1 px-1.5 text-[10px] ${onSurface ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-muted-foreground'}`}
			onclick={back}
			><ForecastIcon name="arrowDown" iconSet={iconType} class="size-3 rotate-90" />Back</Button
		></Card.Action
	>
{/snippet}

<!-- The original layout reserves the card's dimensions while navigation is open. -->
<div
	class="contents"
	style:visibility={screen === 'overview' ? 'visible' : 'hidden'}
	inert={screen !== 'overview'}
	aria-hidden={screen !== 'overview'}
>
	{@render children(openDay, weekAction, screen === 'overview')}
</div>
{#if interactive && screen !== 'overview'}
	<div
		bind:this={surface}
		tabindex="-1"
		role="group"
		aria-label={screen === 'day'
			? `${selected?.label} ${title.toLowerCase()} forecast`
			: summary
				? summaryTitle
				: `${title} • Week`}
		data-slot="forecast-screen"
		class={`absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden rounded-[inherit] bg-card text-card-foreground outline-none ${screen === 'day' && flush ? 'gap-0' : screen === 'week' ? 'gap-2 py-3' : 'gap-(--card-spacing) py-(--card-spacing)'}`}
	>
		{#if screen === 'day' && selected}
			{@render detail(selected, backAction)}
		{:else}
			<Card.Header class="shrink-0">
				<Card.Title class="truncate">{summary ? summaryTitle : `${title} • Week`}</Card.Title>
				{@render backAction(false)}
			</Card.Header>
			<Card.Content class="min-h-0 min-w-0 flex-1">
				<div use:measure class="h-full min-h-0" data-slot="forecast-week-table">
					{#if summary}{@render summary(availableHeight)}
					{:else}
						<div
							class={`grid h-full content-start gap-x-3 overflow-y-auto ${!daySummary && availableHeight < days.length * 28 ? 'grid-cols-2' : 'grid-cols-1'}`}
						>
							{#each days as day}
								<button
									type="button"
									data-forecast-day={day.key}
									style:height={`${daySummary ? Math.max(32, availableHeight / days.length) : Math.min(28, availableHeight / (!daySummary && availableHeight < days.length * 28 ? Math.ceil(days.length / 2) : days.length))}px`}
									style:font-size={daySummary
										? `clamp(12px, min(4.5cqw, ${availableHeight / days.length / 3}px), 20px)`
										: undefined}
									class="flex min-h-0 min-w-0 items-center justify-between gap-2 border-b text-left text-[11px] hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
									aria-label={`View details for ${day.label}`}
									onclick={(event) => open('day', event.currentTarget, day.key)}
								>
									{#if daySummary}{@render daySummary(day)}{:else}
										<span class="shrink-0 font-medium">{day.label}</span>
										<span
											class="truncate text-muted-foreground"
											title={day.entries.map((entry) => entry.summary).join(' · ')}
											>{day.entries.map((entry) => entry.summary).join(' · ')}</span
										>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</Card.Content>
		{/if}
	</div>
{/if}
