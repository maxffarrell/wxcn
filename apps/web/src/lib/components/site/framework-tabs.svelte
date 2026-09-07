<script lang="ts">
	import { getPage } from '$lib/page.svelte.js';
	const page = getPage();
	import frameworks from '$frameworks';
	import SvelteLogo from '$lib/components/icons/svelte.svelte';
	import { IconBrandReact, IconBrandVue } from '@tabler/icons-svelte';
	import * as Tooltip from '@wxcn/svelte/components/ui/tooltip/index.js';
</script>

<div
	class="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-muted p-1"
	role="navigation"
	aria-label="Framework"
>
	{#each [{ name: 'svelte', label: 'Svelte' }, { name: 'react', label: 'React' }] as entry}
		<a
			href={`${entry.name === 'react' ? `/react${page.path === '/' ? '' : page.path}` : page.path}${page.url.search}`}
			aria-current={page.framework === entry.name ? 'page' : undefined}
			class={`flex size-6 items-center justify-center rounded-md text-xs font-medium sm:h-auto sm:w-auto sm:px-3 sm:py-1 ${page.framework === entry.name ? 'bg-background shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
			title={entry.label}
		>
			{#if entry.name === 'svelte'}<SvelteLogo
					class="size-4 sm:hidden"
					aria-hidden="true"
				/>{:else}<IconBrandReact class="size-4 sm:hidden" aria-hidden="true" />{/if}<span
				class="sr-only sm:not-sr-only">{entry.label}</span
			>
		</a>
	{/each}
	{#each Object.values(frameworks).filter((framework) => framework.status === 'planned') as entry}
		{@const framework = entry.label}
		<Tooltip.Root
			><Tooltip.Trigger
				>{#snippet child({ props })}<button
						{...props}
						aria-disabled="true"
						class="flex size-6 cursor-default items-center justify-center rounded-md text-xs text-muted-foreground/60 sm:h-auto sm:w-auto sm:px-3 sm:py-1"
						onclick={(e) => e.preventDefault()}
						>{#if framework === 'React'}<IconBrandReact
								class="size-4 sm:hidden"
								aria-hidden="true"
							/>{:else}<IconBrandVue class="size-4 sm:hidden" aria-hidden="true" />{/if}<span
							class="sr-only sm:not-sr-only">{framework}</span
						></button
					>{/snippet}</Tooltip.Trigger
			><Tooltip.Content id={`contributors-${framework.toLowerCase()}`} role="tooltip"
				>Looking for contributors!</Tooltip.Content
			></Tooltip.Root
		>
	{/each}
</div>
