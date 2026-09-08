<script lang="ts">
	import CopyButton from '$lib/components/copy-button.svelte';
	let { code, html }: { code: string; html: string } = $props();
</script>

<figure data-rehype-pretty-code-figure>
	{@html html}
	<CopyButton text={code} />
</figure>
