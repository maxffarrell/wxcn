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
		| 'rhea'
		| 'sera';

	let {
		value = 'new-york',
		onStyleChange
	}: {
		value: ShadcnStyle;
		onStyleChange: (style: ShadcnStyle) => void;
	} = $props();

	const styles: { value: ShadcnStyle; label: string }[] = [
		{ value: 'new-york', label: 'New York' },
		{ value: 'default', label: 'Default' },
		{ value: 'nova', label: 'Nova' },
		{ value: 'vega', label: 'Vega' },
		{ value: 'maia', label: 'Maia' },
		{ value: 'lyra', label: 'Lyra' },
		{ value: 'mira', label: 'Mira' },
		{ value: 'luma', label: 'Luma' },
		{ value: 'rhea', label: 'Rhea' },
		{ value: 'sera', label: 'Sera' }
	];
</script>

<div
	class="flex min-w-0 items-center gap-1 overflow-x-auto"
	aria-label="Component style"
>
	<span class="mr-1 shrink-0 text-xs font-medium text-muted-foreground"
		>Style</span
	>
	{#each styles as style (style.value)}
		<Button
			variant={value === style.value ? 'default' : 'ghost'}
			size="xs"
			class="shrink-0"
			aria-pressed={value === style.value}
			onclick={() => onStyleChange(style.value)}
		>
			{style.label}
		</Button>
	{/each}
</div>
