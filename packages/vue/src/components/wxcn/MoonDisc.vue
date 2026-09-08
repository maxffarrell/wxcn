<script setup lang="ts">
import { computed, useId } from 'vue';
import { cn } from '../../lib/utils';
const props = withDefaults(defineProps<{ phase?: number; label?: string; class?: string }>(), {
	phase: 0.5,
	label: 'Full moon',
	class: 'size-24'
});
const id = useId().replace(/:/g, '');
const light = computed(() => {
	const p = ((props.phase % 1) + 1) % 1,
		w = p <= 0.5,
		t = Math.cos(p * Math.PI * 2) * (w ? 1 : -1);
	const points = Array.from({ length: 97 }, (_, i) => {
		const y = 1 - i / 48;
		return `${50 + 46 * Math.sqrt(Math.max(0, 1 - y * y)) * t} ${50 + 46 * y}`;
	});
	return `M50 4 A46 46 0 0 ${w ? 1 : 0} 50 96 L${points.join(' L')} Z`;
});
</script>
<template>
	<svg viewBox="0 0 100 100" :class="cn(props.class)" role="img" :aria-label="label">
		<defs>
			<radialGradient :id="`${id}-surface`" cx="42%" cy="38%" r="65%">
				<stop stop-color="#f1f1ed" />
				<stop offset=".72" stop-color="#d9dad5" />
				<stop offset="1" stop-color="#a8aca8" />
			</radialGradient>
		</defs>
		<circle cx="50" cy="50" r="46" fill="#30343a" />
		<path :d="light" :fill="`url(#${id}-surface)`" />
		<circle
			cx="50"
			cy="50"
			r="46"
			fill="none"
			stroke="currentColor"
			stroke-opacity=".08"
			stroke-width=".5"
		/>
	</svg>
</template>
