<script lang="ts">
	import { getPage } from '$lib/page.svelte.js';
	const page = getPage();
	import frameworks from '$frameworks';
	import SvelteLogo from '$lib/components/icons/svelte.svelte';
	import { IconBrandReact, IconBrandVue } from '@tabler/icons-svelte';
</script>

<div
	class="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-muted p-1"
	role="navigation"
	aria-label="Framework"
>
	{#each Object.entries(frameworks)
		.filter(([, entry]) => entry.status === 'available')
		.map(([name, entry]) => ({ name, label: entry.label })) as entry}
		<a
			href={`${entry.name !== 'svelte' ? `/${entry.name}${page.path === '/' ? '' : page.path}` : page.path}${page.url.search}`}
			aria-current={page.framework === entry.name ? 'page' : undefined}
			class={`flex size-6 items-center justify-center rounded-md text-xs font-medium sm:h-auto sm:w-auto sm:px-3 sm:py-1 ${page.framework === entry.name ? 'bg-background shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
			title={entry.label}
		>
			{#if entry.name === 'svelte'}<SvelteLogo
					class="size-4 sm:hidden"
					aria-hidden="true"
				/>{:else if entry.name === 'vue'}<IconBrandVue
					class="size-4 sm:hidden"
					aria-hidden="true"
				/>{:else}<IconBrandReact class="size-4 sm:hidden" aria-hidden="true" />{/if}<span
				class="sr-only sm:not-sr-only">{entry.label}</span
			>
		</a>
	{/each}
</div>
