<script lang="ts">
	let {
		phase = 0.5,
		label = 'Full moon',
		class: className = 'size-24'
	}: { phase?: number; label?: string; class?: string } = $props();
	const id = $props.id();
	const light = $derived.by(() => {
		const p = ((phase % 1) + 1) % 1;
		const waxing = p <= 0.5;
		const sign = waxing ? 1 : -1;
		const terminator = Math.cos(p * Math.PI * 2) * sign;
		const points = Array.from({ length: 97 }, (_, i) => {
			const y = 1 - i / 48;
			return `${50 + 46 * Math.sqrt(Math.max(0, 1 - y * y)) * terminator} ${50 + 46 * y}`;
		});
		return `M50 4 A46 46 0 0 ${waxing ? 1 : 0} 50 96 L${points.join(' L')} Z`;
	});
</script>

<svg viewBox="0 0 100 100" class={className} role="img" aria-label={label}>
	<defs
		><radialGradient id={`${id}-surface`} cx="42%" cy="38%" r="65%"
			><stop stop-color="#f1f1ed" /><stop offset=".72" stop-color="#d9dad5" /><stop
				offset="1"
				stop-color="#a8aca8"
			/></radialGradient
		></defs
	>
	<circle cx="50" cy="50" r="46" fill="#30343a" />
	<path d={light} fill={`url(#${id}-surface)`} />
	<circle
		cx="50"
		cy="50"
		r="46"
		fill="none"
		stroke="currentColor"
		stroke-opacity=".08"
		stroke-width=".5"
	/>
</svg>
