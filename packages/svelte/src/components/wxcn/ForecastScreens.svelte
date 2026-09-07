<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import * as Card from '../ui/card/index.js';
	import { Button } from '../ui/button/index.js';
	import type { ForecastDay } from '@wxcn/core/forecast-days.js';
	let {
		flush = false,
		interactive,
		days,
		title,
		density,
		sourceLabel,
		children
	}: {
		flush?: boolean;
		interactive: boolean;
		days: ForecastDay[];
		title: string;
		density: string;
		sourceLabel: string;
		children: Snippet<[(time: string, trigger: HTMLElement) => void]>;
	} = $props();
	let screen = $state<'overview' | 'week' | 'day'>('overview');
	let selectedKey = $state('');
	let originIndex = 0;
	let host = $state<HTMLElement>();
	let heading = $state<HTMLHeadingElement>();
	const selected = $derived(days.find((day) => day.key === selectedKey));
	$effect(() => {
		if (!interactive || (screen === 'day' && !selected)) screen = 'overview';
	});
	async function open(next: 'week' | 'day', trigger: HTMLElement, key = '') {
		if (screen === 'overview') {
			host = trigger.closest<HTMLElement>('[data-slot=card]') ?? undefined;
			if (host)
				originIndex = [...host.querySelectorAll('button')].indexOf(trigger as HTMLButtonElement);
		}
		selectedKey = key;
		screen = next;
		await tick();
		heading?.focus();
	}
	function openDay(time: string, trigger: HTMLElement) {
		const day = days.find((day) => day.entries.some((entry) => entry.time === Date.parse(time)));
		if (day) void open('day', trigger, day.key);
	}
	async function back() {
		screen = 'overview';
		await tick();
		host?.querySelectorAll('button')[originIndex]?.focus();
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

{#if !interactive || screen === 'overview'}
	{@render children(openDay)}
	{#if interactive}
		<Card.Content class={flush ? 'pb-(--card-spacing)' : ''}>
			<Button
				variant="outline"
				size="sm"
				class="w-full"
				onclick={(event) => open('week', event.currentTarget)}>View Week</Button
			>
		</Card.Content>
	{/if}
{:else}
	<Card.Header class={flush ? 'pt-(--card-spacing)' : ''}>
		<Card.Title
			><h3 bind:this={heading} tabindex="-1" class="outline-none">
				{screen === 'day' && selected ? selected.label : `${title} this week`}
			</h3></Card.Title
		>
		<Card.Description
			>{screen === 'day' ? 'Daily details' : 'Available forecast · select a day'}</Card.Description
		>
		<Card.Action><Button variant="ghost" size="sm" onclick={back}>Back</Button></Card.Action>
	</Card.Header>
	<Card.Content class={`min-w-0 ${flush ? 'pb-(--card-spacing)' : ''}`}>
		{#if screen === 'day' && selected}
			<dl class="divide-y text-sm">
				{#each selected.entries as entry}
					<div class={density === 'compact' ? 'py-2' : 'py-3'}>
						<dt class="font-medium">{entry.label} · {entry.summary}</dt>
						<dd class="mt-2 text-xs leading-5 text-muted-foreground">{entry.details}</dd>
					</div>
				{/each}
			</dl>
			<Button
				variant="outline"
				size="sm"
				class="mt-3 w-full"
				onclick={(event) => open('week', event.currentTarget)}>View Week</Button
			>
		{:else if days.length}
			<table class="w-full text-left text-xs">
				<caption class="sr-only">{title} weekly summary</caption>
				<thead class="text-muted-foreground"
					><tr class="border-b"
						><th scope="col" class="py-2 pr-3 font-normal">Day</th><th
							scope="col"
							class="py-2 font-normal">Forecast</th
						></tr
					></thead
				>
				<tbody class="divide-y">
					{#each days as day}
						<tr
							><th
								scope="row"
								class={`pr-3 align-top font-medium ${density === 'compact' ? 'py-2' : 'py-3'}`}
								><button
									type="button"
									class="min-h-8 text-left underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
									aria-label={`View details for ${day.label}`}
									onclick={(event) => open('day', event.currentTarget, day.key)}>{day.label}</button
								></th
							><td class={density === 'compact' ? 'py-2' : 'py-3'}
								>{#each day.entries as entry}<p class="leading-5">{entry.summary}</p>{/each}</td
							></tr
						>
					{/each}
				</tbody>
			</table>
		{:else}<p role="status" class="py-8 text-center text-sm text-muted-foreground">
				No forecast available.
			</p>{/if}
		{#if sourceLabel}<p class="mt-3 text-[10px] text-muted-foreground">{sourceLabel}</p>{/if}
	</Card.Content>
{/if}
