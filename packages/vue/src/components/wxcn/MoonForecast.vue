<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { forecastDays, type ForecastDay } from '@wxcn/core/forecast-days.js';
import { getMoonForecast, sampleMoon } from '@wxcn/core/moon.js';
import type { ForecastType, LocationInput, MoonForecast as MoonData } from '@wxcn/core/types.js';
import type { IconSet } from '../../icons/ForecastIcon.vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import ForecastScreens from './ForecastScreens.vue';
import MoonDisc from './MoonDisc.vue';
const props = withDefaults(
	defineProps<{
		iconType?: IconSet;
		interactive?: boolean;
		timeZone?: string;
		type?: ForecastType;
		size?: 'sm' | 'default' | 'lg';
		density?: 'compact' | 'comfortable';
		class?: string;
		location?: LocationInput;
		forecast?: MoonData;
		sourceLabel?: string;
	}>(),
	{
		interactive: false,
		type: 'summary',
		size: 'default',
		density: 'comfortable',
		forecast: () => sampleMoon,
		sourceLabel: '',
		location: () => ({ label: 'Austin, TX', latitude: 30.2672, longitude: -97.7431 })
	}
);
const visitor = ref('UTC');
onMounted(() => (visitor.value = Intl.DateTimeFormat().resolvedOptions().timeZone));
const zone = computed(() => props.timeZone ?? props.location.timeZone ?? visitor.value);
const date = (v: string) =>
	new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: zone.value }).format(
		new Date(v)
	);
const days = computed(() =>
	forecastDays(
		Array.from({ length: 7 }, (_, i) => {
			const v = i
				? getMoonForecast(new Date(Date.parse(props.forecast.date) + i * 864e5))
				: props.forecast;
			return {
				time: Date.parse(v.date),
				label: v.phaseName,
				summary: `${v.illumination}% illuminated`,
				details: `Moon age: ${v.age} days. Next full moon: ${date(v.nextFullMoon)}. Next new moon: ${date(v.nextNewMoon)}.`
			};
		}),
		zone.value
	)
);
function view(day?: ForecastDay) {
	return day && day.entries[0].time !== Date.parse(props.forecast.date)
		? getMoonForecast(new Date(day.entries[0].time))
		: props.forecast;
}
import { defineComponent, h } from 'vue';
const MoonView = defineComponent({
	props: { day: Object },
	setup(p) {
		return () => {
			const vm = p.day as ForecastDay | undefined;
			const v = view(vm);
			return [
				h(CardHeader, null, {
					default: () => [
						h(CardTitle, null, { default: () => vm?.label ?? 'Moon phase' }),
						h(CardDescription, null, { default: () => props.location.label })
					]
				}),
				h(
					CardContent,
					{
						class: [
							'grid px-[var(--card-spacing,var(--wxcn-spacing))]',
							props.density === 'compact' ? 'gap-3' : 'gap-5'
						]
					},
					{
						default: () => [
							h(
								'div',
								{
									class: [
										'flex items-center gap-4',
										props.size === 'lg' && 'flex-col rounded-lg bg-muted/20 p-5 text-center'
									]
								},
								[
									h(MoonDisc, {
										phase: v.phase ?? v.age / 29.530588853,
										label: `${v.phaseName}, ${v.illumination}% illuminated`,
										class:
											props.size === 'sm'
												? 'size-16 shrink-0'
												: props.size === 'lg'
													? 'size-36 shrink-0'
													: 'size-24 max-w-[28cqw] shrink-0'
									}),
									h('div', null, [
										h(
											'p',
											{
												style: { fontSize: 'clamp(1rem,6cqw,1.5rem)' },
												class: 'font-medium tracking-tight'
											},
											v.phaseName
										),
										h(
											'p',
											{ class: 'mt-2 text-sm text-muted-foreground' },
											`${v.illumination}% illuminated`
										)
									])
								]
							),
							props.type !== 'simple'
								? h(
										'dl',
										{ class: 'moon-data divide-y text-sm' },
										[
											['Moon age', `${v.age} days`],
											['Next full moon', date(v.nextFullMoon)],
											['Next new moon', date(v.nextNewMoon)]
										].map(([a, b], index) =>
											h(
												'div',
												{
													class: `flex justify-between gap-4 ${index === 0 ? 'pb-3' : index === 2 ? 'pt-3' : 'py-3'}`
												},
												[h('dt', { class: 'text-muted-foreground' }, a), h('dd', null, b)]
											)
										)
									)
								: null,
							!vm && props.sourceLabel
								? h(
										'p',
										{ class: 'text-[10px] text-muted-foreground' },
										`${props.sourceLabel} · ${date(v.date)}`
									)
								: null
						]
					}
				)
			];
		};
	}
});
</script>
<template>
	<Card
		:style="{ containerType: 'inline-size', '--wxcn-spacing': size === 'sm' ? '1rem' : '1.5rem' }"
		:data-density="density"
		:data-card-size="size"
		:data-size="size === 'sm' ? 'sm' : 'default'"
		:class="['relative isolate min-w-0 overflow-hidden', props.class]"
	>
		<ForecastScreens
			:interactive="interactive"
			:icon-type="iconType"
			:days="days"
			title="Moon"
			:density="density"
			:source-label="sourceLabel"
		>
			<template #overview><MoonView :day="undefined" /></template
			><template #detail="{ day }"><MoonView :day="day" /></template> </ForecastScreens
	></Card>
</template>
