# @wxcn/vue

Native Vue 3 weather, tide, moon, and dashboard components with the same data contracts and rendering options as `@wxcn/svelte`.

Install the dashboard and its dependencies through the native shadcn-vue registry flow:

```sh
pnpm dlx shadcn-vue@latest add https://wxcn.dev/r/vue/forecast-dashboard.json
```

```vue
<script setup lang="ts">
import ForecastDashboard from '@/components/wxcn/ForecastDashboard.vue';
</script>

<template>
	<ForecastDashboard interactive background="realistic" />
</template>
```

Within this workspace, `@wxcn/vue` exports `WeatherForecast`, `TideForecast`, `MoonForecast`, `ForecastDashboard`, and the shared data and astronomy helpers from `@wxcn/core`.

The registry uses native shadcn-vue icon transforms for navigation. Its icon index does not yet map the weather glyphs, so those retain their canonical Lucide shapes. The workspace preview supports all five icon libraries.

Weather supports `background="none"` or `"realistic"`. Legacy `dithered` and `gradient` values currently render without a background, matching Svelte.
