<script lang="ts">
	import { UseClipboard } from '$lib/hooks/use-clipboard.svelte.js';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	let { code, html }: { code: string; html: string } = $props();
	const clipboard = new UseClipboard();
	onDestroy(() => clearTimeout(clipboard.timeout));
</script>

<figure
	data-rehype-pretty-code-figure
	class="relative overflow-hidden rounded-xl border bg-muted/30"
>
	<Button
		data-slot="copy-button"
		variant="ghost"
		size="sm"
		class="absolute top-2 right-2 z-10"
		onclick={() => clipboard.copy(code)}>{clipboard.copied ? 'Copied' : 'Copy'}</Button
	>
	<div
		class="overflow-auto [&_pre]:m-0! [&_pre]:max-h-96 [&_pre]:overflow-auto [&_pre]:border-0! [&_pre]:p-4! [&_pre]:pt-12!"
	>
		{@html html}
	</div>
</figure>
