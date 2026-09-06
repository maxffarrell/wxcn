<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	const FALLBACK_STAR_COUNT = 0;
	import GithubIcon from './github.svelte';

	async function getGithubStarCount() {
		try {
			const res = await fetch('https://ungh.cc/repos/maxffarrell/wxcn-svelte', {
				signal: AbortSignal.timeout(5000)
			});
			if (!res.ok) return FALLBACK_STAR_COUNT;
			const data = await res.json();
			return data.repo?.stars ?? FALLBACK_STAR_COUNT;
		} catch (error) {
			console.error(error);
			return FALLBACK_STAR_COUNT;
		}
	}

	let stars = $state(FALLBACK_STAR_COUNT);

	onMount(async () => {
		stars = await getGithubStarCount();
	});
</script>

<Button
	aria-label={`View wxcn-svelte on GitHub (${stars} stars)`}
	href="https://github.com/maxffarrell/wxcn-svelte"
	target="_blank"
	rel="noreferrer"
	size="sm"
	variant="ghost"
	class="h-8 shadow-none"
>
	<GithubIcon />
	<span class="w-8 text-xs text-muted-foreground tabular-nums">
		{stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars.toLocaleString()}
	</span>
</Button>
