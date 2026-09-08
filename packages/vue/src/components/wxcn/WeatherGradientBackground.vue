<script setup lang="ts">
import { computed } from 'vue';
import type { SkyState } from '@wxcn/core/sky.js';
import type { WeatherShaderMode } from './WeatherShaderBackground.vue';
const p = withDefaults(defineProps<{ mode?: WeatherShaderMode; sky?: SkyState | null }>(), {
	mode: 'clear',
	sky: null
});
const period = computed(
	() =>
		p.sky?.period ??
		(p.mode.includes('night')
			? 'night'
			: p.mode === 'sunrise' || p.mode === 'sunset'
				? p.mode
				: 'midday')
);
const weather = computed(() =>
	/rain|drizzle|thunderstorm|wintry/.test(p.mode)
		? 'rain'
		: /snow/.test(p.mode)
			? 'snow'
			: /cloudy|fog|haze/.test(p.mode)
				? 'cloud'
				: 'clear'
);
</script>
<template>
	<div
		class="gradient"
		data-background-style="gradient"
		:data-sky-period="period"
		:data-weather="weather"
		:style="`--sun-x:${(sky?.sun.x ?? 0.8) * 100}%;--sun-y:${(1 - (sky?.sun.y ?? 0.76)) * 100}%`"
		aria-hidden="true"
	>
		<span
			v-if="sky?.sun.visible"
			class="sun"
			:style="`left:${sky.sun.x * 100}%;top:${(1 - sky.sun.y) * 100}%`"
		/><span
			v-if="sky?.moon.visible"
			class="moon"
			:style="`left:${sky.moon.x * 100}%;top:${(1 - sky.moon.y) * 100}%`"
		/>
	</div>
</template>
<style scoped>
.gradient {
	position: absolute;
	inset: 0;
	overflow: hidden;
	container-type: size;
	background:
		radial-gradient(ellipse at var(--sun-x) var(--sun-y), #f5dba560, transparent 45%),
		linear-gradient(180deg, #32658b, #88b4c3);
}
.gradient[data-sky-period='night'] {
	background: linear-gradient(180deg, #0c1428, #29394f);
}
.gradient[data-sky-period='sunrise'] {
	background:
		radial-gradient(ellipse at var(--sun-x) var(--sun-y), #edab8370, transparent 65%),
		linear-gradient(180deg, #475575, #bd8290 70%, #dda472);
}
.gradient[data-sky-period='sunset'] {
	background:
		radial-gradient(ellipse at var(--sun-x) var(--sun-y), #fba44780, transparent 65%),
		linear-gradient(180deg, #424760, #b4716b 70%, #d39866);
}
.gradient:after {
	content: '';
	position: absolute;
	inset: 0;
}
.gradient[data-weather='cloud']:after {
	background: #71818b55;
}
.gradient[data-weather='rain']:after {
	background: #263c52aa;
}
.gradient[data-weather='snow']:after {
	background: #a4b8c455;
}
.sun,
.moon {
	position: absolute;
	transform: translate(-50%, -50%);
	border-radius: 50%;
}
.sun {
	width: 3.2cqh;
	height: 3.2cqh;
	background: #fff0bd;
	box-shadow: 0 0 3cqh #f4c98966;
}
.moon {
	width: 4.4cqh;
	height: 4.4cqh;
	background: #d9dee6;
	box-shadow: inset 1.6cqh 0 #30343a;
}
</style>
