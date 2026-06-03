<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		...rest
	}: WithElementRef<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement> = $props();
</script>

<p
	bind:this={ref}
	data-slot="card-description"
	class={cn('text-sm text-muted-foreground', className)}
	{...rest}
>
	{@render rest.children?.()}
</p>
