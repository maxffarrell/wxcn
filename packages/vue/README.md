# @wxcn/vue

Native Vue 3 weather, tide, moon, and dashboard components with the same data contracts and rendering options as `@wxcn/svelte`.

```vue
<script setup lang="ts">
import { ForecastDashboard } from '@wxcn/vue';
</script>

<template>
	<ForecastDashboard interactive background="gradient" />
</template>
```

The package exports `WeatherForecast`, `TideForecast`, `MoonForecast`, `ForecastDashboard`, and the shared data and astronomy helpers from `@wxcn/core`.

The registry uses native shadcn-vue icon transforms for navigation. Its icon index does not yet map the weather glyphs, so those retain their canonical Lucide shapes. The workspace preview supports all five icon libraries.
