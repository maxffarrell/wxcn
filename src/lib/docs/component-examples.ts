export const overviewExample = `<script>
	import { WeatherForecast, TideForecast, MoonForecast } from 'wxcn-svelte';
</script>

<WeatherForecast
	type="summary"
	unit="celsius"
	iconType="lucide"
	animatedBackground
/>
<TideForecast type="summary" unit="meter" iconType="tabler" />
<MoonForecast type="simple" iconType="phosphor-svelte" />`;

export const weatherExample = `<WeatherForecast
	type="summary"
	unit="celsius"
	iconType="hugeicons"
	animatedBackground
/>`;

export const tideExample = `<TideForecast type="summary" unit="meter" iconType="tabler" />`;

export const moonExample = `<MoonForecast type="summary" iconType="remix" />`;
