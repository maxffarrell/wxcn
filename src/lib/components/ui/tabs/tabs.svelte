<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let { class: className, ...rest }: TabsPrimitive.RootProps = $props();
</script>

<TabsPrimitive.Root class={cn('w-full', className)} {...rest}>
	{@render rest.children?.()}
</TabsPrimitive.Root>
