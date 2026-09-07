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
		sourceLabel,
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
	let pageSize = $state(1);
	let page = $state(0);
	const pageCount = $derived(Math.max(1, Math.ceil(days.length / pageSize)));
	const visibleDays = $derived(days.slice(page * pageSize, (page + 1) * pageSize));
	const selected = $derived(days.find((day) => day.key === selectedKey));
	$effect(() => {
		if (!interactive || (screen === 'day' && !selected)) screen = 'overview';
	});
	$effect(() => {
		if (page >= pageCount) page = pageCount - 1;
	});
	function measure(node: HTMLElement) {
		const update = () => {
			pageSize = Math.max(1, Math.floor((node.clientHeight - 24 - (sourceLabel ? 22 : 0)) / 32));
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
			page = 0;
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
			page = Math.floor(days.findIndex((day) => day.key === selectedKey) / pageSize);
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
				aria-label={`View ${title.toLowerCase()} week`}
				onclick={(event) => open('week', event.currentTarget)}>View week</Button
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
			: `${title} week`}
		data-slot="forecast-screen"
		class={`absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden rounded-[inherit] bg-card text-card-foreground outline-none ${screen === 'day' && flush ? 'gap-0' : 'gap-(--card-spacing) py-(--card-spacing)'}`}
	>
		{#if screen === 'day' && selected}
			{@render detail(selected, backAction)}
		{:else}
			<Card.Header class="shrink-0">
				<Card.Title class="truncate">{title} week</Card.Title>
				<Card.Description class="text-xs" aria-live="polite"
					>{days.length
						? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, days.length)} of ${days.length} days`
						: 'No forecast available'}</Card.Description
				>
				<Card.Action class="flex items-center gap-0.5">
					{#if pageCount > 1}
						<Button
							variant="ghost"
							size="sm"
							class="size-6 p-0"
							aria-label="Previous forecast days"
							disabled={page === 0}
							onclick={() => page--}
							><ForecastIcon name="arrowDown" iconSet={iconType} class="size-3 rotate-90" /></Button
						>
						<Button
							variant="ghost"
							size="sm"
							class="size-6 p-0"
							aria-label="Next forecast days"
							disabled={page === pageCount - 1}
							onclick={() => page++}
							><ForecastIcon
								name="arrowDown"
								iconSet={iconType}
								class="size-3 -rotate-90"
							/></Button
						>
					{/if}
					<Button
						variant="ghost"
						size="sm"
						class="h-6 px-1.5 text-[10px] text-muted-foreground"
						onclick={back}>Back</Button
					>
				</Card.Action>
			</Card.Header>
			<Card.Content class="min-h-0 min-w-0 flex-1">
				<div use:measure class="h-full min-h-0" data-slot="forecast-week-table">
					{#if days.length}<table class="w-full table-fixed text-left text-xs">
							<caption class="sr-only">{title} weekly summary</caption>
							<thead class="h-6 text-muted-foreground"
								><tr class="border-b"
									><th scope="col" class="w-2/5 pr-2 font-normal">Day</th><th
										scope="col"
										class="font-normal">Forecast</th
									></tr
								></thead
							>
							<tbody class="divide-y"
								>{#each visibleDays as day}<tr class="h-8"
										><th scope="row" class="pr-2 font-medium"
											><button
												data-forecast-day={day.key}
												type="button"
												class="min-h-6 text-left text-[11px] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
												aria-label={`View details for ${day.label}`}
												onclick={(event) => open('day', event.currentTarget, day.key)}
												>{day.label}</button
											></th
										><td
											><p
												class="truncate"
												title={day.entries.map((entry) => entry.summary).join(' · ')}
											>
												{day.entries.map((entry) => entry.summary).join(' · ')}
											</p></td
										></tr
									>{/each}</tbody
							>
						</table>{/if}
					{#if sourceLabel}<p
							class="mt-2 truncate text-[10px] text-muted-foreground"
							title={sourceLabel}
						>
							{sourceLabel}
						</p>{/if}
				</div>
			</Card.Content>
		{/if}
	</div>
{/if}
