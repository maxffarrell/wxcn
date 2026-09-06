<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';
	let { ...props }: SVGAttributes<SVGElement> = $props();
</script>

<svg
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.7"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	{...props}
	><path d="M4 15a4 4 0 0 1 1.8-7.6A5.5 5.5 0 0 1 16.4 7a4 4 0 0 1 3.6 6" /><path
		d="M3 18c3-3 6 3 9 0s6 3 9 0M3 22c3-3 6 3 9 0s6 3 9 0"
	/></svg
>
