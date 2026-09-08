<script setup lang="ts">
import { ForecastDashboard, WeatherForecast, TideForecast, MoonForecast } from '@wxcn/vue';
</script>
<template>
	<main>
		<h1>wxcn Vue</h1>
		<ForecastDashboard interactive background="gradient" />
		<section>
			<WeatherForecast interactive /><TideForecast interactive /><MoonForecast interactive />
		</section>
	</main>
</template>
