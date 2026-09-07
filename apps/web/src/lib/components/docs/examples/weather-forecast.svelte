<script lang="ts">
	import WeatherForecast from '@wxcn/svelte/components/wxcn/WeatherForecast.svelte';
</script>

<div class="w-full max-w-sm">
	<WeatherForecast
		interactive
		unit="celsius"
		background="realistic"
		showTemperatureTrend
		showHighLow
	/>
</div>
