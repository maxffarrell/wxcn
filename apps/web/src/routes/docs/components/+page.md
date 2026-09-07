<script lang="ts">
  import ComponentDocs from '$lib/components/docs/ComponentDocs.svelte';
  let { data } = $props();
</script>

# Components

Weather, moon, and tide components that inherit your shadcn-svelte theme, base components, and icon library.

<ComponentDocs {data} />
