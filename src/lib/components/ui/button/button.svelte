<script lang="ts" module>
	import { cn } from '$lib/utils.js';

	const variants = {
		default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
		outline:
			'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
		secondary:
			'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
		ghost: 'hover:bg-accent hover:text-accent-foreground',
		destructive:
			'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
		link: 'text-primary underline-offset-4 hover:underline'
	} as const;

	const sizes = {
		default: 'h-9 px-4 py-2 has-[>svg]:px-3',
		xs: 'h-7 gap-1.5 rounded-md px-2 text-xs has-[>svg]:px-2',
		sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
		lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
		icon: 'size-9',
		'icon-xs': 'size-7',
		'icon-sm': 'size-8',
		'icon-lg': 'size-10'
	} as const;

	export type ButtonVariant = keyof typeof variants;
	export type ButtonSize = keyof typeof sizes;

	export function buttonVariants({
		variant = 'default',
		size = 'default'
	}: {
		variant?: ButtonVariant | null;
		size?: ButtonSize | null;
	} = {}) {
		return cn(
			"inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
			variants[variant ?? 'default'],
			sizes[size ?? 'default']
		);
	}
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type ButtonProps = HTMLButtonAttributes &
		HTMLAnchorAttributes & {
			ref?: HTMLButtonElement | HTMLAnchorElement | null;
			variant?: ButtonVariant;
			size?: ButtonSize;
			href?: string;
			disabled?: boolean;
		};

	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href,
		type = 'button',
		disabled,
		...rest
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? 'link' : undefined}
		tabindex={disabled ? -1 : undefined}
		{...rest}
	>
		{@render rest.children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...rest}
	>
		{@render rest.children?.()}
	</button>
{/if}
