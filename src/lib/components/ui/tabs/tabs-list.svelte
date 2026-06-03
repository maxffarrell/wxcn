<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let { class: className, ...rest }: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
	data-slot="tabs-list"
	class={cn(
		'inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground',
		className
	)}
	{...rest}
>
	{@render rest.children?.()}
</TabsPrimitive.List>
