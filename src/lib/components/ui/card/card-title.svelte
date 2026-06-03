<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		...rest
	}: WithElementRef<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement> = $props();
</script>

<h3
	bind:this={ref}
	data-slot="card-title"
	class={cn('font-semibold leading-none', className)}
	{...rest}
>
	{@render rest.children?.()}
</h3>
