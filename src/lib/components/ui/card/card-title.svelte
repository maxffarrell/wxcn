<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, ...rest }: HTMLAttributes<HTMLHeadingElement> = $props();
</script>

<h3 class={cn('text-lg font-semibold leading-none tracking-normal', className)} {...rest}>
	{@render rest.children?.()}
</h3>
