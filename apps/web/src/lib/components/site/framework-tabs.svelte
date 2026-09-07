<script lang="ts">
	import frameworks from '$frameworks';
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
		class="rounded-md bg-background px-3 py-1 text-xs font-medium shadow-xs">Svelte</button
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
						class="cursor-default rounded-md px-3 py-1 text-xs text-muted-foreground/60"
						onclick={(e) => e.preventDefault()}>{framework}</button
					>{/snippet}</Tooltip.Trigger
			><Tooltip.Content id={`contributors-${framework.toLowerCase()}`} role="tooltip"
				>Looking for contributors!</Tooltip.Content
			></Tooltip.Root
		>
	{/each}
</div>
