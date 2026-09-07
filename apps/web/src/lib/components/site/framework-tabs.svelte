<script lang="ts">
	import frameworks from '$frameworks';
	import SvelteLogo from '$lib/components/icons/svelte.svelte';
	import { IconBrandReact, IconBrandVue } from '@tabler/icons-svelte';
	import * as Tooltip from '@wxcn/svelte/components/ui/tooltip/index.js';
</script>

<div
	class="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-muted p-1"
	role="tablist"
	aria-label="Framework"
>
	<button
		role="tab"
		aria-selected="true"
		class="flex size-6 items-center justify-center rounded-md bg-background text-xs font-medium shadow-xs sm:h-auto sm:w-auto sm:px-3 sm:py-1"
		title="Svelte"
		><SvelteLogo class="size-4 sm:hidden" aria-hidden="true" /><span class="sr-only sm:not-sr-only"
			>Svelte</span
		></button
	>
	{#each Object.values(frameworks).filter((framework) => framework.status === 'planned') as entry}
		{@const framework = entry.label}
		<Tooltip.Root
			><Tooltip.Trigger
				>{#snippet child({ props })}<button
						{...props}
						role="tab"
						aria-selected="false"
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
