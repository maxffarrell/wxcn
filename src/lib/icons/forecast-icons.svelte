<script lang="ts">
	import { CloudSun, Moon, Sun, Waves, Wind } from '@lucide/svelte';
	import { CloudSun as PhCloudSun, Moon as PhMoon, Sun as PhSun, Waves as PhWaves, Wind as PhWind } from 'phosphor-svelte';
	import { IconCloud, IconMoon, IconSun, IconWind, IconWavesElectricity } from '@tabler/icons-svelte';
	import { RiCloudy2Line, RiMoonLine, RiSunLine, RiWindyLine, RiWaterFlashLine } from 'remixicon-svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import type { Component } from 'svelte';
	import type { IconSvgElement } from '@hugeicons/svelte';
	import {
		Moon02Icon,
		Sun03Icon,
		SunCloud02Icon,
		WaterfallUp01Icon,
		WindPower02Icon
	} from '@hugeicons/core-free-icons';
	import type { IconSet } from '$lib/data/types.js';

	type IconName = 'weather' | 'tide' | 'moon' | 'sun' | 'wind';

	let {
		name,
		iconSet = 'lucide',
		class: className = 'size-5'
	}: {
		name: IconName;
		iconSet?: IconSet;
		class?: string;
	} = $props();

	const iconMap = {
		lucide: { weather: CloudSun, tide: Waves, moon: Moon, sun: Sun, wind: Wind },
		'phosphor-svelte': {
			weather: PhCloudSun,
			tide: PhWaves,
			moon: PhMoon,
			sun: PhSun,
			wind: PhWind
		},
		tabler: {
			weather: IconCloud,
			tide: IconWavesElectricity,
			moon: IconMoon,
			sun: IconSun,
			wind: IconWind
		},
		remix: {
			weather: RiCloudy2Line,
			tide: RiWaterFlashLine,
			moon: RiMoonLine,
			sun: RiSunLine,
			wind: RiWindyLine
		},
		hugeicons: { weather: SunCloud02Icon, tide: WaterfallUp01Icon, moon: Moon02Icon, sun: Sun03Icon, wind: WindPower02Icon }
	};

	const Icon = $derived(iconMap[iconSet][name]);
	const hugeIcon = $derived(Icon as IconSvgElement);
	const ComponentIcon = $derived(Icon as Component<{ class?: string }>);
</script>

{#if iconSet === 'hugeicons'}
	<HugeiconsIcon icon={hugeIcon} class={className} />
{:else}
	<ComponentIcon class={className} />
{/if}
