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
		density,
		sourceLabel,
		showWeek = true,
		iconType,
		animated = false,
		background,
		detail,
		children
	}: {
		interactive: boolean;
		days: ForecastDay[];
		title: string;
		density: string;
		sourceLabel: string;
		showWeek?: boolean;
		iconType?: IconSet;
		animated?: boolean;
		background?: Snippet<[ForecastDay]>;
		detail: Snippet<[ForecastDay]>;
		children: Snippet<[(time: string, trigger: HTMLElement) => void, Snippet<[boolean]>, boolean]>;
	} = $props();
	let screen = $state<'overview' | 'week' | 'day'>('overview');
	let selectedKey = $state('');
	let fromWeek = false;
	let weekScrollTop = 0;
	let scroller = $state<HTMLDivElement>();
	let origin: HTMLElement | undefined;
	let originIndex = 0;
	let host: HTMLElement | undefined;
	let heading = $state<HTMLHeadingElement>();
	const selected = $derived(days.find((day) => day.key === selectedKey));
	const onBackground = $derived(screen === 'day' && animated && !!background);
	$effect(() => {
		if (!interactive || (screen === 'day' && !selected)) screen = 'overview';
	});
	async function open(next: 'week' | 'day', trigger: HTMLElement, key = '') {
		if (screen === 'overview') {
			origin = trigger;
			host = trigger.closest<HTMLElement>('[data-slot=card]') ?? undefined;
			if (host)
				originIndex = [...host.querySelectorAll('button')].indexOf(trigger as HTMLButtonElement);
		}
		fromWeek = screen === 'week';
		if (fromWeek) weekScrollTop = scroller?.scrollTop ?? 0;
		selectedKey = key;
		screen = next;
		await tick();
		if (scroller) scroller.scrollTop = 0;
		heading?.focus({ preventScroll: true });
	}
	function openDay(time: string, trigger: HTMLElement) {
		const day = days.find((day) => day.entries.some((entry) => entry.time === Date.parse(time)));
		if (day) void open('day', trigger, day.key);
	}
	async function back() {
		if (screen === 'day' && fromWeek) {
			screen = 'week';
			await tick();
			if (scroller) scroller.scrollTop = weekScrollTop;
			host
				?.querySelector<HTMLButtonElement>(`[data-forecast-day="${selectedKey}"]`)
				?.focus({ preventScroll: true });
		} else {
			screen = 'overview';
			await tick();
			const target = origin?.isConnected ? origin : host?.querySelectorAll('button')[originIndex];
			target?.focus({ preventScroll: true });
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
	{#if interactive && showWeek}
		<Card.Action>
			<Button
				variant="ghost"
				size="sm"
				class={`h-6 px-1.5 text-[10px] font-medium ${onSurface ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
				aria-label={`View ${title.toLowerCase()} week`}
				onclick={(event) => open('week', event.currentTarget)}>View week</Button
			>
		</Card.Action>
	{/if}
{/snippet}

<!-- Retain the overview's layout and mounted controls. The inset screen never
     contributes to card dimensions, including at responsive breakpoints. -->
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
		data-slot="forecast-screen"
		class={`absolute inset-0 z-10 flex min-h-0 flex-col gap-(--card-spacing) overflow-hidden rounded-[inherit] bg-card py-(--card-spacing) ${onBackground ? 'text-white' : 'text-card-foreground'}`}
	>
		{#if onBackground && selected && background}
			<div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
				{@render background(selected)}
			</div>
		{/if}
		<Card.Header class="relative shrink-0">
			<Card.Title
				><h3 bind:this={heading} tabindex="-1" class="outline-none">
					{screen === 'day' && selected ? selected.label : `${title} this week`}
				</h3></Card.Title
			>
			<Card.Description class={onBackground ? 'text-white/70' : ''}
				>{screen === 'day' ? title + ' forecast' : 'Select a day to explore'}</Card.Description
			>
			<Card.Action
				><Button
					variant="ghost"
					size="sm"
					class={`h-6 gap-1 px-1.5 text-[10px] ${onBackground ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-muted-foreground'}`}
					onclick={back}
					><ForecastIcon name="arrowDown" iconSet={iconType} class="size-3 rotate-90" />Back</Button
				></Card.Action
			>
		</Card.Header>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (The scroll region must be focusable so keyboard users can scroll daily details.) -->
		<div
			bind:this={scroller}
			data-slot="forecast-screen-scroll"
			class="relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
			tabindex="0"
			role="region"
			aria-label={screen === 'day' ? `${selected?.label} details` : `${title} weekly forecast`}
		>
			<Card.Content class="min-w-0">
				{#if screen === 'day' && selected}
					{@render detail(selected)}
				{:else if days.length}
					<table class="w-full text-left text-xs">
						<caption class="sr-only">{title} weekly summary</caption>
						<thead class="text-muted-foreground"
							><tr class="border-b"
								><th scope="col" class="pr-3 pb-2 font-normal">Day</th><th
									scope="col"
									class="pb-2 font-normal">Forecast</th
								></tr
							></thead
						>
						<tbody class="divide-y"
							>{#each days as day}
								<tr
									><th
										scope="row"
										class={`pr-3 align-top font-medium ${density === 'compact' ? 'py-2' : 'py-3'}`}
										><button
											data-forecast-day={day.key}
											type="button"
											class="min-h-8 text-left underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
											aria-label={`View details for ${day.label}`}
											onclick={(event) => open('day', event.currentTarget, day.key)}
											>{day.label}</button
										></th
									><td class={density === 'compact' ? 'py-2' : 'py-3'}
										>{#each day.entries as entry}<p class="leading-5">{entry.summary}</p>{/each}</td
									></tr
								>
							{/each}</tbody
						>
					</table>
				{:else}<p role="status" class="py-5 text-center text-sm text-muted-foreground">
						No forecast available.
					</p>{/if}
				{#if sourceLabel}<p
						class={`mt-4 text-[10px] ${onBackground ? 'text-white/60' : 'text-muted-foreground'}`}
					>
						{sourceLabel}
					</p>{/if}
			</Card.Content>
		</div>
	</div>
{/if}
