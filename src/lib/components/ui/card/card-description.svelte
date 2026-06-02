<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, ...rest }: HTMLAttributes<HTMLParagraphElement> = $props();
</script>

<p class={cn('text-sm leading-6 text-muted-foreground', className)} {...rest}>
	{@render rest.children?.()}
</p>
