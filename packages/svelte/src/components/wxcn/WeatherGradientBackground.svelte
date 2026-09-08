<script lang="ts">
	import type { SkyState } from '@wxcn/core/sky.js';
	import type { WeatherShaderMode } from './WeatherShaderBackground.svelte';
	let { mode = 'clear', sky = null }: { mode?: WeatherShaderMode; sky?: SkyState | null } =
		$props();
	const period = $derived(
		sky?.period ??
			(mode.includes('night') ? 'night' : mode === 'sunrise' || mode === 'sunset' ? mode : 'midday')
	);
	const weather = $derived(
		/rain|drizzle|thunderstorm|wintry/.test(mode)
			? 'rain'
			: /snow/.test(mode)
				? 'snow'
				: /cloudy|fog|haze/.test(mode)
					? 'cloud'
					: 'clear'
	);
	const moonPath = $derived.by(() => {
		const z = sky ? 2 * sky.moon.illumination - 1 : -1;
		const points = Array.from({ length: 65 }, (_, i) => {
			const y = 1 - i / 32;
			return `${-z * Math.sqrt(Math.max(0, 1 - y * y))} ${y}`;
		});
		return `M0 -1 A1 1 0 0 1 0 1 L${points.join(' L')} Z`;
	});
	const moonAngle = $derived(
		sky ? (Math.atan2(-sky.moon.light[1], sky.moon.light[0]) * 180) / Math.PI : 0
	);
</script>

<div
	class="gradient"
	data-background-style="gradient"
	data-sky-period={period}
	data-weather={weather}
	style={`--sun-x:${(sky?.sun.x ?? 0.8) * 100}%;--sun-y:${(1 - (sky?.sun.y ?? 0.76)) * 100}%`}
	aria-hidden="true"
>
	{#if sky?.sun.visible}
		<span class="sun" style={`left:${sky.sun.x * 100}%;top:${(1 - sky.sun.y) * 100}%`}></span>
	{/if}
	{#if sky?.moon.visible}
		<svg
			class="moon"
			viewBox="-1 -1 2 2"
			style={`left:${sky.moon.x * 100}%;top:${(1 - sky.moon.y) * 100}%;transform:translate(-50%,-50%) rotate(${moonAngle}deg)`}
		>
			<path d={moonPath} fill="#d9dee6" />
		</svg>
	{/if}
</div>

<style>
	.gradient {
		position: absolute;
		inset: 0;
		overflow: hidden;
		container-type: size;
		background:
			radial-gradient(ellipse at var(--sun-x) var(--sun-y), #f5dba560, transparent 45%),
			linear-gradient(180deg, #32658b, #88b4c3);
	}
	.gradient[data-sky-period='night'] {
		background: linear-gradient(180deg, #0c1428, #29394f);
	}
	.gradient[data-sky-period='sunrise'] {
		background:
			radial-gradient(ellipse at var(--sun-x) var(--sun-y), #edab8370, transparent 65%),
			linear-gradient(180deg, #475575, #bd8290 70%, #dda472);
	}
	.gradient[data-sky-period='sunset'] {
		background:
			radial-gradient(ellipse at var(--sun-x) var(--sun-y), #fba44780, transparent 65%),
			linear-gradient(180deg, #424760, #b4716b 70%, #d39866);
	}
	.gradient::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.gradient[data-weather='cloud']::after {
		background: #71818b55;
	}
	.gradient[data-weather='rain']::after {
		background: #263c52aa;
	}
	.gradient[data-weather='snow']::after {
		background: #a4b8c455;
	}
	.sun,
	.moon {
		position: absolute;
		transform: translate(-50%, -50%);
	}
	.sun {
		width: 3.2cqh;
		height: 3.2cqh;
		border-radius: 50%;
		background: #fff0bd;
		box-shadow: 0 0 3cqh #f4c98966;
	}
	.moon {
		width: 4.4cqh;
		height: 4.4cqh;
	}
</style>
