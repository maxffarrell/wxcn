<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let { class: className, ...rest }: TabsPrimitive.ContentProps = $props();
</script>

<TabsPrimitive.Content
	class={cn('mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
	{...rest}
>
	{@render rest.children?.()}
</TabsPrimitive.Content>
