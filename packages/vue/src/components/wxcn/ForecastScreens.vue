<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { ForecastDay } from '@wxcn/core/forecast-days.js';
import type { IconSet } from '../../icons/ForecastIcon.vue';
import ForecastIcon from '../../icons/ForecastIcon.vue';
import { CardAction, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
const props = withDefaults(
	defineProps<{
		interactive: boolean;
		days: ForecastDay[];
		title: string;
		density: string;
		sourceLabel: string;
		actionLabel?: string;
		showWeek?: boolean;
		iconType?: IconSet;
		flush?: boolean;
		hasSummary?: boolean;
		hasDaySummary?: boolean;
	}>(),
	{ actionLabel: 'View week', showWeek: true, flush: false }
);
const screen = ref<'overview' | 'week' | 'day'>('overview'),
	selectedKey = ref(''),
	surface = ref<HTMLElement>(),
	table = ref<HTMLElement>(),
	availableHeight = ref(0);
let host: HTMLElement | null = null,
	origin: HTMLElement | null = null,
	fromWeek = false,
	observer: ResizeObserver | undefined;
const selected = computed(() => props.days.find((d) => d.key === selectedKey.value));
async function open(next: 'week' | 'day', trigger: HTMLElement, key = '') {
	if (screen.value === 'overview') {
		host = trigger.closest('[data-slot=card]');
		origin = trigger;
	}
	fromWeek = screen.value === 'week';
	selectedKey.value = key;
	screen.value = next;
	await nextTick();
	surface.value?.focus({ preventScroll: true });
}
function openDay(time: string, trigger: HTMLElement) {
	const day = props.days.find((d) => d.entries.some((e) => e.time === Date.parse(time)));
	if (day) void open('day', trigger, day.key);
}
async function back() {
	const day = screen.value === 'day' && fromWeek;
	screen.value = day ? 'week' : 'overview';
	await nextTick();
	requestAnimationFrame(() =>
		requestAnimationFrame(() => {
			(day
				? host?.querySelector<HTMLElement>(`[data-forecast-day="${selectedKey.value}"]`)
				: origin
			)?.focus({ preventScroll: true });
		})
	);
}
watch(
	() => props.interactive,
	(v) => {
		if (!v) screen.value = 'overview';
	}
);
watch(table, (node) => {
	observer?.disconnect();
	if (node) {
		observer = new ResizeObserver(() => (availableHeight.value = node.clientHeight));
		observer.observe(node);
		availableHeight.value = node.clientHeight;
	}
});
onBeforeUnmount(() => observer?.disconnect());
</script>
<template>
	<div
		class="contents"
		:style="{ visibility: screen === 'overview' ? 'visible' : 'hidden' }"
		:inert="screen !== 'overview' || undefined"
		:aria-hidden="screen !== 'overview'"
	>
		<slot name="overview" :open-day="openDay" :visible="screen === 'overview'">
			<slot :open-day="openDay" :visible="screen === 'overview'" />
		</slot>
		<CardAction
			v-if="interactive && showWeek"
			class="absolute top-[var(--wxcn-spacing,1.5rem)] right-[var(--wxcn-spacing,1.5rem)] z-20"
			><Button
				variant="ghost"
				size="sm"
				class="h-6 px-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
				:aria-label="hasSummary ? actionLabel : `View ${title.toLowerCase()} week`"
				@click="open('week', $event.currentTarget as HTMLElement)"
				>{{ actionLabel }}</Button
			></CardAction
		>
	</div>
	<div
		v-if="screen !== 'overview'"
		ref="surface"
		tabindex="-1"
		role="group"
		:aria-label="
			screen === 'day' ? `${selected?.label} ${title.toLowerCase()} forecast` : `${title} • Week`
		"
		data-slot="forecast-screen"
		@keydown="
			if ($event.key === 'Escape') {
				$event.preventDefault();
				back();
			}
		"
		:class="`absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden rounded-[inherit] bg-card text-card-foreground outline-none ${screen === 'day' && flush ? 'gap-0' : screen === 'week' ? 'gap-2 py-3' : 'gap-(--card-spacing) py-(--card-spacing)'}`"
	>
		<template v-if="screen === 'day' && selected"
			><div
				class="absolute top-[var(--wxcn-spacing,1.5rem)] right-[var(--wxcn-spacing,1.5rem)] z-20"
			>
				<Button
					variant="ghost"
					size="sm"
					class="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground"
					@click="back"
					><ForecastIcon
						name="arrowDown"
						:icon-set="iconType"
						class="size-3 rotate-90"
					/>Back</Button
				>
			</div>
			<slot name="detail" :day="selected" :back="back"
		/></template>
		<template v-else
			><CardHeader class="shrink-0"
				><CardTitle class="truncate">{{
					hasSummary ? 'Upcoming tides' : `${title} • Week`
				}}</CardTitle
				><CardAction
					><Button
						variant="ghost"
						size="sm"
						class="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground"
						@click="back"
						><ForecastIcon
							name="arrowDown"
							:icon-set="iconType"
							class="size-3 rotate-90"
						/>Back</Button
					></CardAction
				></CardHeader
			>
			<CardContent class="min-h-0 min-w-0 flex-1"
				><div ref="table" class="h-full min-h-0" data-slot="forecast-week-table">
					<slot v-if="hasSummary" name="summary" :height="availableHeight" />
					<div
						v-else
						:class="`grid h-full content-start gap-x-3 ${!hasDaySummary && availableHeight < days.length * 28 ? 'grid-cols-2' : 'grid-cols-1'}`"
					>
						<button
							v-for="day in days"
							:key="day.key"
							type="button"
							:data-forecast-day="day.key"
							:style="{
								height: `${Math.min(28, availableHeight / (!hasDaySummary && availableHeight < days.length * 28 ? Math.ceil(days.length / 2) : days.length))}px`
							}"
							class="flex min-h-0 min-w-0 items-center justify-between gap-2 border-b text-left text-[11px] hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
							:aria-label="`View details for ${day.label}`"
							@click="open('day', $event.currentTarget as HTMLElement, day.key)"
						>
							<slot name="day-summary" :day="day"
								><span class="shrink-0 font-medium">{{ day.label }}</span
								><span class="truncate text-muted-foreground">{{
									day.entries.map((e) => e.summary).join(' · ')
								}}</span></slot
							>
						</button>
					</div>
				</div></CardContent
			></template
		>
	</div>
</template>
