<script lang="ts">
	import type { WeatherShaderMode } from './WeatherShaderBackground.svelte';
	let { mode = 'clear' }: { mode?: WeatherShaderMode } = $props();
	const palette = $derived(
		mode.includes('night')
			? 'night'
			: mode === 'sunrise' || mode === 'sunset'
				? 'twilight'
				: /rain|drizzle|thunderstorm|wintry/.test(mode)
					? 'rain'
					: /snow/.test(mode)
						? 'snow'
						: /cloudy|fog|haze/.test(mode)
							? 'cloud'
							: 'clear'
	);
</script>

<div
	class="gradient"
	data-background-style="gradient"
	data-palette={palette}
	aria-hidden="true"
></div>

<style>
	.gradient {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse at 85% 5%, #f5dba580, transparent 60%),
			linear-gradient(155deg, #32658b, #88b4c3);
	}
	.gradient[data-palette='night'] {
		background:
			radial-gradient(ellipse at 85% 5%, #818db040, transparent 60%),
			linear-gradient(155deg, #111d38, #394564);
	}
	.gradient[data-palette='twilight'] {
		background: linear-gradient(155deg, #594e79, #b6747b 55%, #dda472);
	}
	.gradient[data-palette='cloud'] {
		background: linear-gradient(155deg, #526575, #9caeb5);
	}
	.gradient[data-palette='rain'] {
		background: linear-gradient(155deg, #263c52, #647f8a);
	}
	.gradient[data-palette='snow'] {
		background: linear-gradient(155deg, #607d95, #b4c7cd);
	}
</style>
