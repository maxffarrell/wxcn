<script lang="ts">
	import PMBlock from '$lib/components/site/pm-block.svelte';
	import { page } from '$app/state';
	import * as Card from '@wxcn/svelte/components/ui/card/index.js';
	import { Button } from '@wxcn/svelte/components/ui/button/index.js';
	import { Badge } from '@wxcn/svelte/components/ui/badge/index.js';
	import registry from '../../../registry.json';
</script>

<svelte:head>
	<title>Registry - wxcn</title>
</svelte:head>

<main class="container py-10">
	<div class="mb-8 flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-3xl font-semibold tracking-normal">Registry</h1>
			<p class="mt-2 max-w-2xl text-muted-foreground">
				Installable shadcn-svelte registry entries for forecast cards and shared helpers.
			</p>
		</div>
		<Button href="/registry.json" variant="outline">View JSON</Button>
	</div>
	<div class="grid gap-4 lg:grid-cols-2">
		{#each registry.items as item (item.name)}
			<Card.Root>
				<Card.Header>
					<div class="flex items-start justify-between gap-4">
						<div>
							<Card.Title>{item.name}</Card.Title>
							<Card.Description>{item.description}</Card.Description>
						</div>
						<Badge variant="secondary">{item.type}</Badge>
					</div>
				</Card.Header>
				<Card.Content>
					<div class="rounded-lg border bg-muted p-3 font-mono text-xs text-muted-foreground">
						{item.files.length} files · {item.registryDependencies.join(', ')}
					</div>
					<PMBlock
						type="execute"
						command={['shadcn-svelte@latest', 'add', `${page.url.origin}/r/${item.name}.json`]}
					/>
					<Button class="mt-4" href={`/r/${item.name}.json`} variant="outline"
						>View installable JSON</Button
					>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</main>
