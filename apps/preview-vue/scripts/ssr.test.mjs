import assert from 'node:assert/strict';
import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';

const server = await createServer({
	root: new URL('..', import.meta.url).pathname,
	configFile: false,
	plugins: [vue()],
	server: { middlewareMode: true, hmr: false },
	appType: 'custom'
});
try {
	const api = await server.ssrLoadModule('/../../packages/vue/src/index.ts');
	const render = (component, props = {}) =>
		renderToString(createSSRApp({ render: () => h(component, props) }));
	const weather = await render(api.WeatherForecast, {
		at: Date.parse('2026-09-06T16:00:00-05:00')
	});
	assert.match(weather, /Weather/);
	assert.match(weather, /Austin, TX/);
	assert.match(weather, /86/);
	const empty = await render(api.WeatherForecast, {
		forecast: [],
		currentWeather: null,
		sourceLabel: '',
		at: 1
	});
	assert.match(empty, /Current conditions unavailable/);
	assert.doesNotMatch(empty, /Sample forecast/);
	const custom = await render(api.WeatherForecast, {
		forecast: [
			{
				name: 'Noon',
				startTime: '2026-06-21T12:00:00-04:00',
				temperature: 20,
				temperatureUnit: 'C',
				windSpeed: '8 mph',
				windDirection: 'S',
				shortForecast: 'Sunny',
				detailedForecast: 'Sunny',
				isDaytime: true
			}
		],
		currentWeather: null,
		location: { label: 'Custom', latitude: 40.7, longitude: -74, timeZone: 'America/New_York' },
		at: Date.parse('2026-06-21T12:00:00-04:00')
	});
	assert.match(custom, /Custom/);
	assert.doesNotMatch(custom, /Austin/);
	const moon = await render(api.MoonForecast);
	assert.match(moon, /Moon phase/);
	assert.match(moon, /illuminated/);
	const tide = await render(api.TideForecast, { at: Date.parse('2026-09-06T16:00:00-05:00') });
	assert.match(tide, /Tides/);
	assert.match(tide, /(high|low) tide/);
	const dashboard = await render(api.ForecastDashboard, { interactive: true });
	assert.match(dashboard, /Weather/);
	assert.match(dashboard, /Tides/);
	assert.match(dashboard, /Moon phase/);
	console.log('Vue SSR contracts passed');
} finally {
	await server.close();
}
