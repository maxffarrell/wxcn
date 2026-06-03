<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		...rest
	}: WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> = $props();
</script>

<div
	bind:this={ref}
	data-slot="card-header"
	class={cn(
		'grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[>[data-slot=card-action]]:grid-cols-[1fr_auto] [&.border-b]:pb-6',
		className
	)}
	{...rest}
>
	{@render rest.children?.()}
</div>
