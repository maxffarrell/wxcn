<script lang="ts">
	let { class: className = 'size-5' }: { class?: string } = $props();
</script>

<span
	class={className}
	style="display: inline-block; background: currentColor; mask: url('/favicon.svg?v=arc-wave') center / contain no-repeat;"
	aria-hidden="true"
></span>
