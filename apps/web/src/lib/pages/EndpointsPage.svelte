<script lang="ts">
	import SiteShell from './SiteShell.svelte';
	import Content from './Endpoints.svx';
	let { url }: { url: string } = $props();
</script>

<SiteShell {url}><Content /></SiteShell>
