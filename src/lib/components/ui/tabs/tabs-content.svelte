<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let { class: className, ...rest }: TabsPrimitive.ContentProps = $props();
</script>

<TabsPrimitive.Content
	data-slot="tabs-content"
	class={cn('mt-2 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50', className)}
	{...rest}
>
	{@render rest.children?.()}
</TabsPrimitive.Content>
