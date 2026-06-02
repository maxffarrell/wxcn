<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
	class={cn('rounded-lg border bg-card text-card-foreground shadow-sm shadow-slate-950/5', className)}
	{...rest}
>
	{@render rest.children?.()}
</div>
