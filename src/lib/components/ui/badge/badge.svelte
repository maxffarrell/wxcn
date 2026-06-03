<script lang="ts" module>
	import { cn } from '$lib/utils.js';

	const variants = {
		default:
			'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
		secondary:
			'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
		destructive:
			'border-transparent bg-destructive text-white focus-visible:ring-destructive/20 [a&]:hover:bg-destructive/90 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
		outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground'
	} as const;

	export type BadgeVariant = keyof typeof variants;

	export function badgeVariants({ variant = 'default' }: { variant?: BadgeVariant | null } = {}) {
		return cn(
			"inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
			variants[variant ?? 'default']
		);
	}
</script>

<script lang="ts">
	import type { WithElementRef } from '$lib/utils.js';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		variant = 'default',
		href,
		...rest
	}: WithElementRef<HTMLAnchorAttributes, HTMLElement> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...rest}
>
	{@render rest.children?.()}
</svelte:element>
