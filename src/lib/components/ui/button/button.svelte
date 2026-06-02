<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'default' | 'secondary' | 'outline' | 'ghost';
	let { class: className, variant = 'default', type = 'button', ...rest }: HTMLButtonAttributes & {
		variant?: Variant;
	} = $props();

	const variants: Record<Variant, string> = {
		default: 'bg-primary text-primary-foreground hover:bg-primary/90',
		secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
		outline: 'border border-input bg-background hover:bg-muted',
		ghost: 'hover:bg-muted'
	};
</script>

<button
	class={cn(
		'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
		variants[variant],
		className
	)}
	{type}
	{...rest}
>
	{@render rest.children?.()}
</button>
