<script lang="ts">
	import SiteShell from './SiteShell.svelte';
	import Content from './Components.svx';
	let {
		url,
		data
	}: {
		url: string;
		data: Awaited<ReturnType<typeof import('$lib/server/component-docs.js').load>>;
	} = $props();
</script>

<SiteShell {url}><Content {data} /></SiteShell>
