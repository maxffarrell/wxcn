<script setup lang="ts">
import { computed, type Component } from 'vue';
import {
	ArrowDown,
	ArrowUp,
	CloudRain,
	CloudSun,
	Moon,
	Snowflake,
	Sun,
	Waves,
	Wind
} from 'lucide-vue-next';
import {
	IconArrowDown,
	IconArrowUp,
	IconCloud,
	IconCloudRain,
	IconMoon,
	IconSnowflake,
	IconSun,
	IconWavesElectricity,
	IconWind
} from '@tabler/icons-vue';
import {
	PhArrowDown,
	PhArrowUp,
	PhCloudRain,
	PhCloudSun,
	PhMoon,
	PhSnowflake,
	PhSun,
	PhWaves,
	PhWind
} from '@phosphor-icons/vue';
import {
	RiArrowDownLine,
	RiArrowUpLine,
	RiCloudy2Line,
	RiMoonLine,
	RiRainyLine,
	RiSnowyLine,
	RiSunLine,
	RiWaterFlashLine,
	RiWindyLine
} from '@remixicon/vue';
import { HugeiconsIcon } from '@hugeicons/vue';
import {
	ArrowDown02Icon,
	ArrowUp02Icon,
	CloudRainIcon,
	Moon02Icon,
	SnowIcon,
	Sun03Icon,
	SunCloud02Icon,
	WaterfallUp01Icon,
	WindPower02Icon
} from '@hugeicons/core-free-icons';
export type IconName =
	'arrowUp' | 'arrowDown' | 'weather' | 'tide' | 'moon' | 'sun' | 'wind' | 'rain' | 'snow';
export type IconSet = 'lucide' | 'tabler' | 'phosphor' | 'hugeicons' | 'remixicon';
const props = withDefaults(defineProps<{ name: IconName; iconSet?: IconSet; class?: string }>(), {
	iconSet: 'lucide',
	class: 'size-5'
});
const maps: Record<Exclude<IconSet, 'hugeicons'>, Record<IconName, Component>> = {
	lucide: {
		arrowUp: ArrowUp,
		arrowDown: ArrowDown,
		weather: CloudSun,
		tide: Waves,
		moon: Moon,
		sun: Sun,
		wind: Wind,
		rain: CloudRain,
		snow: Snowflake
	},
	tabler: {
		arrowUp: IconArrowUp,
		arrowDown: IconArrowDown,
		weather: IconCloud,
		tide: IconWavesElectricity,
		moon: IconMoon,
		sun: IconSun,
		wind: IconWind,
		rain: IconCloudRain,
		snow: IconSnowflake
	},
	phosphor: {
		arrowUp: PhArrowUp,
		arrowDown: PhArrowDown,
		weather: PhCloudSun,
		tide: PhWaves,
		moon: PhMoon,
		sun: PhSun,
		wind: PhWind,
		rain: PhCloudRain,
		snow: PhSnowflake
	},
	remixicon: {
		arrowUp: RiArrowUpLine,
		arrowDown: RiArrowDownLine,
		weather: RiCloudy2Line,
		tide: RiWaterFlashLine,
		moon: RiMoonLine,
		sun: RiSunLine,
		wind: RiWindyLine,
		rain: RiRainyLine,
		snow: RiSnowyLine
	}
};
const huge = {
	arrowUp: ArrowUp02Icon,
	arrowDown: ArrowDown02Icon,
	weather: SunCloud02Icon,
	tide: WaterfallUp01Icon,
	moon: Moon02Icon,
	sun: Sun03Icon,
	wind: WindPower02Icon,
	rain: CloudRainIcon,
	snow: SnowIcon
};
const icon = computed(() =>
	props.iconSet === 'hugeicons' ? HugeiconsIcon : maps[props.iconSet][props.name]
);
const iconData = computed(() => (props.iconSet === 'hugeicons' ? huge[props.name] : undefined));
</script>
<template>
	<component :is="icon" :icon="iconData" :class="props.class" aria-hidden="true" />
</template>
