<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	let { children, ...props }: HTMLAttributes<HTMLPreElement> = $props();
</script>

<!-- Keyboard users must be able to focus and scroll long code examples. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<pre
	{...props}
	role="region"
	aria-label="Code example"
	class="shiki my-6 max-w-full overflow-auto rounded-lg border bg-muted p-4 text-sm"
	tabindex="0">{@render children?.()}</pre>
