<script lang="ts">
	import '../app.css';
	import { Button } from '$lib/components/ui/button/index.js';
	import StyleSelector, { type ShadcnStyle } from '$lib/components/style-selector.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import type { Snippet } from 'svelte';

	let style: ShadcnStyle = $state('new-york');
	let { children }: { children: Snippet } = $props();
</script>

<ModeWatcher themeColors={{ light: '#ffffff', dark: '#020817' }} />

<div class="min-h-screen bg-background" data-style={style}>
	<header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
		<div class="container flex min-h-14 items-center justify-between gap-4 py-2">
			<a href="/" class="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold tracking-normal">
				<span class="size-2 rounded-full bg-primary"></span>
				wxcn-svelte
			</a>
			<nav class="hidden items-center gap-5 text-sm text-muted-foreground lg:flex">
				<a class="transition-colors hover:text-foreground" href="/docs/components">Components</a>
				<a class="transition-colors hover:text-foreground" href="/docs/endpoints">Endpoints</a>
				<a class="transition-colors hover:text-foreground" href="/registry">Registry</a>
			</nav>
			<div class="hidden min-w-0 flex-1 sm:block lg:max-w-2xl">
				<StyleSelector value={style} onStyleChange={(next) => (style = next)} />
			</div>
			<a class="hidden md:block" href="/docs/components">
				<Button class="h-8">Docs</Button>
			</a>
		</div>
	</header>
	{@render children()}
</div>
