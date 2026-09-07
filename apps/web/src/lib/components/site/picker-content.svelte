<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { setContext } from 'svelte';
	import { cn } from '@wxcn/svelte/utils';

	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		sideOffset = 20,
		portalProps,
		class: className,
		submenu = false,
		children,
		...restProps
	}: DropdownMenuPrimitive.ContentProps & {
		portalProps?: DropdownMenuPrimitive.PortalProps;
		submenu?: boolean;
		children?: Snippet;
	} = $props();

	// Submenu items are theme-aware; standalone (non-submenu) items always use dark hardcoded colors.
	setContext('picker-is-submenu', () => submenu);
</script>

{#if submenu}
	<DropdownMenuPrimitive.Portal>
		<DropdownMenuPrimitive.SubContent
			bind:ref
			data-slot="dropdown-menu-sub-content"
			{sideOffset}
			preventScroll={false}
			updatePositionStrategy="always"
			class={cn(
				'z-50 max-h-[min(24rem,var(--bits-dropdown-menu-content-available-height))] w-max max-w-[calc(100vw-2rem)] min-w-52 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain rounded-md bg-popover/90 p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 backdrop-blur-xs',
				className
			)}
			{...restProps}
		>
			{@render children?.()}
		</DropdownMenuPrimitive.SubContent>
	</DropdownMenuPrimitive.Portal>
{:else}
	<DropdownMenuPrimitive.Portal {...portalProps}>
		<DropdownMenuPrimitive.Content
			bind:ref
			data-slot="dropdown-menu-content"
			{sideOffset}
			preventScroll={false}
			updatePositionStrategy="always"
			collisionPadding={16}
			class={cn(
				'cn-menu-target z-50 max-h-[min(24rem,var(--bits-dropdown-menu-content-available-height))] w-max max-w-[calc(100vw-2rem)] min-w-52 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border-0 bg-neutral-950/95 p-1.5 text-neutral-100 ring-1 ring-neutral-950/80 backdrop-blur-xl outline-none dark:bg-neutral-800/95 dark:ring-neutral-700/50',
				className
			)}
			{...restProps}
		>
			{@render children?.()}
		</DropdownMenuPrimitive.Content>
	</DropdownMenuPrimitive.Portal>
{/if}
