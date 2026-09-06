<script lang="ts">
	import '../app.css';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ModeWatcher, toggleMode } from 'mode-watcher';
	import { page } from '$app/state';
	import { setContext, type Snippet } from 'svelte';
	import type { IconSet } from '$lib/data/types.js';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Menu from '@lucide/svelte/icons/menu';
	let { children }: { children: Snippet } = $props();
	let menuOpen = $state(false);
	const icons = $state<{ value: IconSet }>({ value: 'lucide' });
	setContext('wxcn-icons', icons);
	const links = [
		{ href: '/docs/components', label: 'Components' },
		{ href: '/docs/endpoints', label: 'Data sources' },
		{ href: '/registry', label: 'Registry' }
	];
</script>

<ModeWatcher themeColors={{ light: '#ffffff', dark: '#171717' }} />
<a
	href="#main-content"
	class="sr-only fixed top-2 left-2 z-50 rounded bg-primary p-3 text-primary-foreground focus:not-sr-only"
	>Skip to content</a
>
<header class="border-b border-border/60">
	<div class="container flex h-16 items-center gap-8">
		<a
			href="/"
			class="flex items-center gap-2.5 text-sm font-semibold tracking-tight"
			aria-label="wxcn-svelte home"
			><svg
				viewBox="0 0 24 24"
				class="size-6"
				fill="none"
				stroke="currentColor"
				stroke-width="1.7"
				aria-hidden="true"><path d="M5 16 15 6M9 19 19 9" /><path d="M4 9h3M16 20h3" /></svg
			>wxcn-svelte</a
		>
		<nav aria-label="Main navigation" class="hidden items-center gap-6 text-sm md:flex">
			{#each links as link}<a
					href={link.href}
					aria-current={page.url.pathname === link.href ? 'page' : undefined}
					class="text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground"
					>{link.label}</a
				>{/each}
		</nav>
		<div class="ml-auto flex items-center gap-2">
			<a
				class="mr-2 hidden text-xs text-muted-foreground hover:text-foreground sm:block"
				href="https://www.shadcn-svelte.com">Built for shadcn-svelte</a
			>
			<Button variant="ghost" size="icon-sm" aria-label="Toggle theme" onclick={toggleMode}
				><Sun class="size-4 dark:hidden" /><Moon class="hidden size-4 dark:block" /></Button
			>
			<Button href="/docs/components" size="sm" class="hidden sm:inline-flex">Get started</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				class="md:hidden"
				aria-label="Toggle navigation"
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}><Menu class="size-4" /></Button
			>
		</div>
	</div>
	{#if menuOpen}<nav
			aria-label="Mobile navigation"
			class="container flex flex-wrap gap-5 border-t py-4 text-sm md:hidden"
		>
			{#each links as link}<a href={link.href} onclick={() => (menuOpen = false)}>{link.label}</a
				>{/each}
		</nav>{/if}
</header>
<div id="main-content" tabindex="-1">{@render children()}</div>
<footer class="mt-16 border-t">
	<div
		class="container flex flex-col justify-between gap-3 py-8 text-xs leading-5 text-muted-foreground sm:flex-row"
	>
		<p>Open source. Open code. Yours to make your own.</p>
		<p>
			Built with <a
				class="text-foreground underline underline-offset-4"
				href="https://www.shadcn-svelte.com">shadcn-svelte</a
			>. Weather by NWS. Tides by NOAA.
		</p>
	</div>
</footer>
