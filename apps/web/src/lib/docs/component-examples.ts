export const overviewExample = `<script>
 import WeatherForecast from '@wxcn/svelte/components/wxcn/WeatherForecast.svelte';
 import TideForecast from '@wxcn/svelte/components/wxcn/TideForecast.svelte';
 import MoonForecast from '@wxcn/svelte/components/wxcn/MoonForecast.svelte';
</script>

<!-- Icons and base components follow components.json at installation. -->
<WeatherForecast unit="celsius" animatedBackground />
<TideForecast unit="meter" />
<MoonForecast type="simple" />`;

export const weatherExample = `<WeatherForecast
 type="summary"
 unit="celsius"
 animatedBackground
/>`;
export const tideExample = `<TideForecast type="summary" unit="meter" />`;
export const moonExample = `<MoonForecast type="summary" />`;
