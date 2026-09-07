<script lang="ts">
	import { Button } from '@wxcn/svelte/components/ui/button/index.js';
	import * as Tooltip from '@wxcn/svelte/components/ui/tooltip/index.js';
	import MobileNav from '$lib/components/site/mobile-nav.svelte';
	import ModeSwitcher from '$lib/components/site/mode-switcher.svelte';
	import GithubLink from '$lib/components/site/github-link.svelte';
	import Logo from '$lib/components/site/logo.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { setPage } from '$lib/page.svelte.js';
	import { onMount, setContext, untrack, type Snippet } from 'svelte';
	import { registerWebMCP } from '$lib/webmcp.js';
	import { UserConfigContext } from '$lib/user-config.svelte.js';
	import type { IconSet } from '@wxcn/core/types.js';
	import { mainNavItems } from '$lib/navigation.js';
	let { children, url }: { children: Snippet; url: string } = $props();
	const page = setPage(untrack(() => url));
	const icons = $state<{ value: IconSet }>({ value: 'lucide' });
	setContext('wxcn-icons', icons);
	const userConfig = UserConfigContext.set();
	onMount(() => {
		try {
			const pm = localStorage.getItem('wxcn-package-manager');
			if (pm) userConfig.setConfig({ packageManager: pm });
		} catch {}
	});
	onMount(registerWebMCP);
</script>

<ModeWatcher themeColors={{ light: '#ffffff', dark: '#171717' }} />
<Tooltip.Provider>
	<a
		href="#main-content"
		class="sr-only fixed top-2 left-2 z-50 rounded bg-primary p-3 text-primary-foreground focus:not-sr-only"
		>Skip to content</a
	>
	<header class="fixed inset-x-0 top-0 z-50 w-full bg-background">
		<div class="flex h-16 items-center gap-6 px-4 md:px-6">
			<MobileNav class="flex lg:hidden" />
			<a
				href="/"
				class="hidden items-center gap-2 text-sm font-semibold lg:flex"
				aria-label="wxcn home"><Logo class="size-6" /><span>wxcn</span></a
			>
			<nav aria-label="Main navigation" class="hidden items-center gap-5 text-sm lg:flex">
				{#each mainNavItems.slice(1) as link}<a
						href={link.href}
						class="text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground"
						aria-current={page.url.pathname === link.href ? 'page' : undefined}>{link.title}</a
					>{/each}
			</nav>
			<div class="ml-auto flex items-center gap-2">
				<GithubLink />
				<div class="h-4 w-px bg-border"></div>
				<ModeSwitcher />{#if page.url.pathname !== '/'}<Button href="/" size="sm">Customize</Button
					>{/if}
			</div>
		</div>
	</header>
	<div id="main-content" tabindex="-1" class="pt-16">{@render children()}</div>
	{#if page.url.pathname !== '/'}<footer
			class="container mt-12 border-t py-8 text-xs text-muted-foreground"
		>
			Built with <a href="https://www.shadcn-svelte.com" class="underline underline-offset-4"
				>shadcn-svelte</a
			>. Open source. Open code.
		</footer>{/if}
</Tooltip.Provider>
