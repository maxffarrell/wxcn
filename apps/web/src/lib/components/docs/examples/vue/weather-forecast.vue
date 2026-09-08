<script setup lang="ts">
import WeatherForecast from '@/components/wxcn/WeatherForecast.vue';
</script>

<template>
	<WeatherForecast
		interactive
		unit="celsius"
		background="realistic"
		show-temperature-trend
		show-high-low
	/>
</template>
