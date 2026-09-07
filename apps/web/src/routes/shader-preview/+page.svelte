<script lang="ts">
	import WeatherShaderBackground, {
		type WeatherShaderMode
	} from '@wxcn/svelte/components/wxcn/WeatherShaderBackground.svelte';
	import { page } from '$app/state';

	const modes: WeatherShaderMode[] = [
		'sunrise',
		'sunset',
		'clear',
		'partly-cloudy',
		'haze',
		'fog',
		'wind',
		'cloudy',
		'thunderstorm',
		'rain',
		'heavy-rain',
		'drizzle',
		'snow',
		'heavy-snow',
		'wintry-mix',
		'clear-night',
		'partly-cloudy-night',
		'drizzle-night'
	];

	const requestedMode = $derived(page.url.searchParams.get('mode'));
	const mode = $derived(
		modes.includes(requestedMode as WeatherShaderMode)
			? (requestedMode as WeatherShaderMode)
			: 'rain'
	);
</script>

<svelte:head>
	<title>Shader preview</title>
</svelte:head>

<main class="min-h-screen bg-background p-4 text-foreground">
	<div
		class="mx-auto"
		style="display: grid; max-width: 1180px; grid-template-columns: 180px minmax(0, 1fr); gap: 16px;"
	>
		<aside style="display: grid; align-content: start; gap: 6px;">
			{#each modes as item (item)}
				<a
					href={`/shader-preview?mode=${item}`}
					class="border text-left text-sm transition-colors hover:bg-muted data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
					style="display: block; border-radius: 8px; padding: 6px 10px;"
					data-active={mode === item}
				>
					{item}
				</a>
			{/each}
		</aside>

		<section
			class="relative overflow-hidden rounded-xl border bg-card shadow-sm"
			style="height: 720px;"
		>
			<WeatherShaderBackground {mode} />
			<div
				class="absolute top-5 left-5 rounded-md bg-black/35 px-3 py-2 text-sm font-medium text-white backdrop-blur"
			>
				{mode}
			</div>
		</section>
	</div>
</main>
