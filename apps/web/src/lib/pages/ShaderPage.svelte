<script lang="ts">
	import SiteShell from './SiteShell.svelte';
	import Content from './ShaderPreview.svelte';
	let { url }: { url: string } = $props();
</script>

<SiteShell {url}><Content /></SiteShell>
