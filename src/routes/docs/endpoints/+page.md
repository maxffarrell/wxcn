# Endpoints

The registry avoids free APIs that restrict commercial use.

## Weather

NWS API data is open data and free to use for any purpose. Use `fetchWeatherForecast(location)` with a United States latitude and longitude.

```ts
import { fetchWeatherForecast } from 'wxcn';

const forecast = await fetchWeatherForecast({
	label: 'Austin, TX',
	latitude: 30.2672,
	longitude: -97.7431
});
```

## Tides

NOAA CO-OPS predictions are fetched by station id.

```ts
import { fetchTidePredictions } from 'wxcn';

const predictions = await fetchTidePredictions({
	label: 'Galveston Pier 21, TX',
	latitude: 29.31,
	longitude: -94.7933,
	station: '8771450'
});
```

## Moon

Moon data is calculated locally from the synodic month. This keeps the component usable in commercial products without an external moon API dependency.

```ts
import { getMoonForecast } from 'wxcn';

const moon = getMoonForecast(new Date());
```
