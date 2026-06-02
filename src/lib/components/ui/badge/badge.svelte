<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	type Variant = 'default' | 'secondary' | 'outline' | 'accent';
	let { class: className, variant = 'default', ...rest }: HTMLAttributes<HTMLDivElement> & {
		variant?: Variant;
	} = $props();

	const variants: Record<Variant, string> = {
		default: 'border-transparent bg-primary text-primary-foreground',
		secondary: 'border-transparent bg-secondary text-secondary-foreground',
		outline: 'text-foreground',
		accent: 'border-transparent bg-accent text-accent-foreground'
	};
</script>

<div
	class={cn(
		'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors',
		variants[variant],
		className
	)}
	{...rest}
>
	{@render rest.children?.()}
</div>
