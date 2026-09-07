<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { setContext, onMount } from 'svelte';
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
	let preview: HTMLElement | null = $state(null);
	let previewHeight = $state(384);
	// A virtual bottom edge lets Floating UI position every menu inside the preview.
	const previewAnchor = {
		getBoundingClientRect() {
			const rect = preview?.getBoundingClientRect();
			return rect ? new DOMRect(rect.x, rect.bottom, rect.width, 0) : new DOMRect();
		}
	};
	onMount(() => {
		preview = document.querySelector('[data-slot="preview-frame"]');
		if (!preview) return;
		const observer = new ResizeObserver(() => {
			previewHeight = preview?.clientHeight ?? 384;
		});
		observer.observe(preview);
		return () => observer.disconnect();
	});
</script>

{#if submenu}
	<DropdownMenuPrimitive.Portal>
		<DropdownMenuPrimitive.SubContent
			bind:ref
			data-slot="dropdown-menu-sub-content"
			customAnchor={preview ? previewAnchor : null}
			side={preview ? 'top' : undefined}
			sideOffset={preview ? 8 : sideOffset}
			align="start"
			avoidCollisions={!preview}
			style={`--picker-height: ${Math.max(96, previewHeight - 16)}px`}
			preventScroll={false}
			updatePositionStrategy="always"
			class={cn(
				'z-50 max-h-[min(var(--picker-height),var(--bits-dropdown-menu-content-available-height))] w-(--bits-dropdown-menu-anchor-width) max-w-[calc(100vw-2rem)] min-w-0 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain rounded-md bg-popover/90 p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 backdrop-blur-xs duration-150 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
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
			customAnchor={preview ? previewAnchor : null}
			side={preview ? 'top' : undefined}
			sideOffset={preview ? 8 : sideOffset}
			align="start"
			avoidCollisions={!preview}
			style={`--picker-height: ${Math.max(96, previewHeight - 16)}px`}
			preventScroll={false}
			updatePositionStrategy="always"
			collisionPadding={16}
			class={cn(
				'cn-menu-target z-50 max-h-[min(var(--picker-height),var(--bits-dropdown-menu-content-available-height))] w-(--bits-dropdown-menu-anchor-width) max-w-[calc(100vw-2rem)] min-w-0 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border-0 bg-neutral-950/95 p-1.5 text-neutral-100 ring-1 ring-neutral-950/80 backdrop-blur-xl duration-150 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 dark:bg-neutral-800/95 dark:ring-neutral-700/50',
				className
			)}
			{...restProps}
		>
			{@render children?.()}
		</DropdownMenuPrimitive.Content>
	</DropdownMenuPrimitive.Portal>
{/if}
