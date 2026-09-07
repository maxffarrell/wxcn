export const overviewExample = `<script>
 import WeatherForecast from '@wxcn/svelte/components/wxcn/WeatherForecast.svelte';
 import TideForecast from '@wxcn/svelte/components/wxcn/TideForecast.svelte';
 import MoonForecast from '@wxcn/svelte/components/wxcn/MoonForecast.svelte';
</script>

<!-- Icons and base components follow components.json at installation. -->
<WeatherForecast interactive unit="celsius" animatedBackground />
<TideForecast interactive unit="meter" />
<MoonForecast interactive type="simple" />`;

export const weatherExample = `<WeatherForecast interactive
 type="summary"
 unit="celsius"
 animatedBackground
/>`;
export const tideExample = `<TideForecast interactive type="summary" unit="meter" />`;
export const moonExample = `<MoonForecast interactive type="summary" />`;
