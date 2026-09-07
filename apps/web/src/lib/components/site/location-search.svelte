<script lang="ts">
	type Place = { label: string; latitude: number; longitude: number };
	let {
		label,
		onselect,
		onlocate
	}: { label: string; onselect: (place: Place) => void; onlocate: () => void } = $props();
	const id = $props.id();
	let query = $state('');
	let open = $state(false);
	let results = $state<Place[]>([]);
	let active = $state(-1);
	let loading = $state(false);
	let error = $state('');
	$effect(() => {
		const term = query.trim();
		results = [];
		active = -1;
		error = '';
		if (term.length < 2) {
			loading = false;
			return;
		}
		const controller = new AbortController();
		loading = true;
		const timer = setTimeout(async () => {
			try {
				const response = await fetch(`/api/locations?q=${encodeURIComponent(term)}`, {
					signal: controller.signal
				});
				if (!response.ok) throw new Error('Search unavailable');
				const data = await response.json();
				if (!controller.signal.aborted) results = data.results;
			} catch {
				if (!controller.signal.aborted) error = 'Search unavailable. Try again.';
			} finally {
				if (!controller.signal.aborted) loading = false;
			}
		}, 200);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});
	function choose(place: Place) {
		open = false;
		query = '';
		onselect(place);
	}
	function keydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			open = false;
			return;
		}
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			open = true;
			if (results.length)
				active = (active + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
		}
		if (event.key === 'Enter' && open && results[active]) {
			event.preventDefault();
			choose(results[active]);
		}
	}
</script>

<div
	class="relative min-w-40 flex-1 sm:max-w-64"
	onfocusout={(event) => {
		if (!event.currentTarget.contains(event.relatedTarget as Node)) open = false;
	}}
>
	<input
		class="h-8 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
		role="combobox"
		aria-label="Search US cities"
		aria-autocomplete="list"
		aria-expanded={open && query.length >= 2}
		aria-controls={`${id}-results`}
		aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
		placeholder={label || 'Search US cities…'}
		bind:value={query}
		oninput={() => {
			open = true;
			active = -1;
		}}
		onfocus={() => (open = true)}
		onkeydown={keydown}
		autocomplete="off"
	/>
	{#if open}
		<div
			class="absolute top-full z-50 mt-1 w-full min-w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
		>
			<button
				type="button"
				class="w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
				onclick={() => {
					open = false;
					query = '';
					onlocate();
				}}>Use my location</button
			>
			<div id={`${id}-results`} role="listbox" aria-label="Locations">
				{#each results as place, index}
					<button
						type="button"
						role="option"
						id={`${id}-${index}`}
						aria-selected={active === index}
						class="w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent aria-selected:bg-accent"
						onpointermove={() => (active = index)}
						onclick={() => choose(place)}>{place.label}</button
					>
				{/each}
			</div>
			{#if query.length >= 2}<p role="status" class="px-2 py-1 text-xs text-muted-foreground">
					{loading ? 'Searching…' : error || (!results.length ? 'No matching US places.' : '')}
				</p>{:else}<p class="px-2 py-1 text-xs text-muted-foreground">
					Search US cities and towns
				</p>{/if}
		</div>
	{/if}
</div>
