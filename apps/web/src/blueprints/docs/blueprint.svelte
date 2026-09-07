<script module>
	export { default as pre } from '$lib/components/mdsx/pre.svelte';
	export { default as h1 } from '$lib/components/mdsx/h1.svelte';
	export { default as h2 } from '$lib/components/mdsx/h2.svelte';
	export { default as h3 } from '$lib/components/mdsx/h3.svelte';
	export { default as h4 } from '$lib/components/mdsx/h4.svelte';
	export { default as h5 } from '$lib/components/mdsx/h5.svelte';
	export { default as h6 } from '$lib/components/mdsx/h6.svelte';

	export { default as WeatherForecast } from '@wxcn/svelte/components/wxcn/WeatherForecast.svelte';
	export { default as TideForecast } from '@wxcn/svelte/components/wxcn/TideForecast.svelte';
	export { default as MoonForecast } from '@wxcn/svelte/components/wxcn/MoonForecast.svelte';
	export { default as ForecastDashboard } from '@wxcn/svelte/components/wxcn/ForecastDashboard.svelte';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	let { children }: { children: Snippet } = $props();
</script>

<svelte:head
	><title>{page.url.pathname.endsWith('endpoints') ? 'Data sources' : 'Components'} — wxcn</title
	></svelte:head
>
<div class="container grid gap-10 py-10 lg:grid-cols-[180px_minmax(0,1fr)]">
	<aside class="hidden lg:block">
		<nav aria-label="Documentation" class="sticky top-8 grid gap-1 text-sm">
			<p class="mb-3 font-medium">Documentation</p>
			{#each [{ href: '/docs/components', label: 'Components' }, { href: '/docs/endpoints', label: 'Data sources' }, { href: '/registry', label: 'Registry' }] as link}<a
					href={link.href}
					aria-current={page.url.pathname === link.href ? 'page' : undefined}
					class="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
					>{link.label}</a
				>{/each}
		</nav>
	</aside>
	<main class="wxcn-docs max-w-5xl">{@render children()}</main>
</div>
