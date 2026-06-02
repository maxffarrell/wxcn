<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	let {
		code,
		language = 'svelte',
		children
	}: {
		code: string;
		language?: string;
		children?: Snippet;
	} = $props();

	let highlighted = $state('');

	function shikiHtml(node: HTMLElement, value: string) {
		node.innerHTML = value;

		return {
			update(next: string) {
				node.innerHTML = next;
			},
			destroy() {
				node.innerHTML = '';
			}
		};
	}

	onMount(() => {
		let cancelled = false;

		async function highlight() {
			const { codeToHtml } = await import('shiki');
			const html = await codeToHtml(code.trim(), {
				lang: language,
				themes: {
					light: 'github-light',
					dark: 'github-dark'
				},
				defaultColor: false
			});

			if (!cancelled) highlighted = html;
		}

		highlight();

		return () => {
			cancelled = true;
		};
	});
</script>

<Card.Root class="wxcn-example-viewer">
	<Tabs.Root value="preview">
		<div class="flex items-center justify-between border-b px-3 py-2">
			<Tabs.List>
				<Tabs.Trigger value="preview">Preview</Tabs.Trigger>
				<Tabs.Trigger value="code">Code</Tabs.Trigger>
			</Tabs.List>
		</div>

		<Tabs.Content value="preview" class="m-0">
			<div class="bg-muted/30 p-4 sm:p-6">
				{@render children?.()}
			</div>
		</Tabs.Content>

		<Tabs.Content value="code" class="m-0">
			<div class="wxcn-code-viewer">
				{#if highlighted}
					<div use:shikiHtml={highlighted}></div>
				{:else}
					<pre><code>{code.trim()}</code></pre>
				{/if}
			</div>
		</Tabs.Content>
	</Tabs.Root>
</Card.Root>
