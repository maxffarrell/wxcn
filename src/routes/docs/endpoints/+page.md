# Endpoints

The registry avoids free APIs that restrict commercial use.

## Weather

NWS API data is open data and free to use for any purpose. Use `fetchWeatherForecast(location)` with a United States latitude and longitude.

```ts
import { fetchWeatherForecast } from 'wxcn-svelte';

const forecast = await fetchWeatherForecast({
	label: 'Austin, TX',
	latitude: 30.2672,
	longitude: -97.7431
});
```

## Tides

NOAA CO-OPS predictions are fetched by station id.

```ts
import { fetchTidePredictions } from 'wxcn-svelte';

const predictions = await fetchTidePredictions({
	label: 'Charleston Harbor',
	latitude: 32.781,
	longitude: -79.923,
	station: '8665530'
});
```

## Moon

Moon data is calculated locally from the synodic month. This keeps the component usable in commercial products without an external moon API dependency.

```ts
import { getMoonForecast } from 'wxcn-svelte';

const moon = getMoonForecast(new Date());
```
