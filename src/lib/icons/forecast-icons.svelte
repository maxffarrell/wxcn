<script lang="ts">
	import CloudSun from '@lucide/svelte/icons/cloud-sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import Waves from '@lucide/svelte/icons/waves';
	import Wind from '@lucide/svelte/icons/wind';
	import CloudRain from '@lucide/svelte/icons/cloud-rain';
	import Snowflake from '@lucide/svelte/icons/snowflake';
	import PhCloudSun from 'phosphor-svelte/lib/CloudSun';
	import PhMoon from 'phosphor-svelte/lib/Moon';
	import PhSun from 'phosphor-svelte/lib/Sun';
	import PhWaves from 'phosphor-svelte/lib/Waves';
	import PhWind from 'phosphor-svelte/lib/Wind';
	import PhRain from 'phosphor-svelte/lib/CloudRain';
	import PhSnow from 'phosphor-svelte/lib/Snowflake';
	import IconCloud from '@tabler/icons-svelte/icons/cloud';
	import IconMoon from '@tabler/icons-svelte/icons/moon';
	import IconSun from '@tabler/icons-svelte/icons/sun';
	import IconWind from '@tabler/icons-svelte/icons/wind';
	import IconWavesElectricity from '@tabler/icons-svelte/icons/waves-electricity';
	import IconCloudRain from '@tabler/icons-svelte/icons/cloud-rain';
	import IconSnowflake from '@tabler/icons-svelte/icons/snowflake';
	import RiCloudy2Line from 'remixicon-svelte/icons/cloudy-2-line';
	import RiMoonLine from 'remixicon-svelte/icons/moon-line';
	import RiSunLine from 'remixicon-svelte/icons/sun-line';
	import RiWindyLine from 'remixicon-svelte/icons/windy-line';
	import RiWaterFlashLine from 'remixicon-svelte/icons/water-flash-line';
	import RiRainyLine from 'remixicon-svelte/icons/rainy-line';
	import RiSnowyLine from 'remixicon-svelte/icons/snowy-line';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { getContext, type Component } from 'svelte';
	import type { IconSvgElement } from '@hugeicons/svelte';
	import CloudRainIcon from '@hugeicons/core-free-icons/CloudRainIcon';
	import SnowIcon from '@hugeicons/core-free-icons/SnowIcon';
	import Moon02Icon from '@hugeicons/core-free-icons/Moon02Icon';
	import Sun03Icon from '@hugeicons/core-free-icons/Sun03Icon';
	import SunCloud02Icon from '@hugeicons/core-free-icons/SunCloud02Icon';
	import WaterfallUp01Icon from '@hugeicons/core-free-icons/WaterfallUp01Icon';
	import WindPower02Icon from '@hugeicons/core-free-icons/WindPower02Icon';
	import type { IconSet } from '$lib/data/types.js';

	type IconName = 'weather' | 'tide' | 'moon' | 'sun' | 'wind' | 'rain' | 'snow';

	let {
		name,
		iconSet,
		class: className = 'size-5'
	}: {
		name: IconName;
		iconSet?: IconSet;
		class?: string;
	} = $props();

	const context = getContext<{ value: IconSet } | undefined>('wxcn-icons');
	const selected = $derived(iconSet ?? context?.value ?? 'lucide');
	const iconMap = {
		lucide: {
			weather: CloudSun,
			tide: Waves,
			moon: Moon,
			sun: Sun,
			wind: Wind,
			rain: CloudRain,
			snow: Snowflake
		},
		'phosphor-svelte': {
			weather: PhCloudSun,
			tide: PhWaves,
			moon: PhMoon,
			sun: PhSun,
			rain: PhRain,
			snow: PhSnow,
			wind: PhWind
		},
		tabler: {
			weather: IconCloud,
			tide: IconWavesElectricity,
			moon: IconMoon,
			sun: IconSun,
			rain: IconCloudRain,
			snow: IconSnowflake,
			wind: IconWind
		},
		remix: {
			weather: RiCloudy2Line,
			tide: RiWaterFlashLine,
			moon: RiMoonLine,
			sun: RiSunLine,
			rain: RiRainyLine,
			snow: RiSnowyLine,
			wind: RiWindyLine
		},
		hugeicons: {
			weather: SunCloud02Icon,
			tide: WaterfallUp01Icon,
			moon: Moon02Icon,
			sun: Sun03Icon,
			rain: CloudRainIcon,
			snow: SnowIcon,
			wind: WindPower02Icon
		}
	};

	const Icon = $derived(iconMap[selected][name]);
	const hugeIcon = $derived(Icon as IconSvgElement);
	const ComponentIcon = $derived(Icon as Component<{ class?: string }>);
</script>

{#if selected === 'hugeicons'}
	<HugeiconsIcon icon={hugeIcon} class={className} />
{:else}
	<ComponentIcon class={className} />
{/if}
