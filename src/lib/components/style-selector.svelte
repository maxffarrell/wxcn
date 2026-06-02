<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';

	export type ShadcnStyle =
		| 'default'
		| 'new-york'
		| 'nova'
		| 'vega'
		| 'maia'
		| 'lyra'
		| 'mira'
		| 'luma'
		| 'sera'
		| 'rhea';

	let {
		value = 'default',
		onStyleChange
	}: {
		value: ShadcnStyle;
		onStyleChange: (style: ShadcnStyle) => void;
	} = $props();

	const styles: { value: ShadcnStyle; label: string }[] = [
		{ value: 'default', label: 'Default' },
		{ value: 'new-york', label: 'New York' },
		{ value: 'nova', label: 'Nova' },
		{ value: 'vega', label: 'Vega' },
		{ value: 'maia', label: 'Maia' },
		{ value: 'lyra', label: 'Lyra' },
		{ value: 'mira', label: 'Mira' },
		{ value: 'luma', label: 'Luma' },
		{ value: 'sera', label: 'Sera' },
		{ value: 'rhea', label: 'Rhea' }
	];

</script>

<div class="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1 shadow-sm">
	<span class="px-2 text-xs font-medium text-muted-foreground">Style</span>
	{#each styles as style (style.value)}
		<Button
			variant={value === style.value ? 'default' : 'ghost'}
			class="h-8 px-3 text-xs"
			onclick={() => onStyleChange(style.value)}
		>
			{style.label}
		</Button>
	{/each}
</div>
