import * as React from 'react';
import {
	ArrowDown as PhArrowDown,
	ArrowUp as PhArrowUp,
	CloudRain as PhCloudRain,
	CloudSun as PhCloudSun,
	Moon as PhMoon,
	Snowflake as PhSnowflake,
	Sun as PhSun,
	Waves as PhWaves,
	Wind as PhWind
} from '@phosphor-icons/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
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
} from '@tabler/icons-react';
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
} from '@remixicon/react';
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
} from 'lucide-react';

export type IconName =
	'arrowUp' | 'arrowDown' | 'weather' | 'tide' | 'moon' | 'sun' | 'wind' | 'rain' | 'snow';

export type IconSet = 'lucide' | 'tabler' | 'phosphor' | 'hugeicons' | 'remixicon';

type IconProps = { className?: string; 'aria-hidden'?: boolean };
type IconComponent = React.ComponentType<IconProps>;

const hugeIcon = (icon: IconSvgElement): IconComponent => {
	const Component = (props: IconProps) => <HugeiconsIcon icon={icon} {...props} />;
	return Component;
};

const iconMaps: Record<IconSet, Record<IconName, React.ElementType>> = {
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
	},
	hugeicons: {
		arrowUp: hugeIcon(ArrowUp02Icon),
		arrowDown: hugeIcon(ArrowDown02Icon),
		weather: hugeIcon(SunCloud02Icon),
		tide: hugeIcon(WaterfallUp01Icon),
		moon: hugeIcon(Moon02Icon),
		sun: hugeIcon(Sun03Icon),
		wind: hugeIcon(WindPower02Icon),
		rain: hugeIcon(CloudRainIcon),
		snow: hugeIcon(SnowIcon)
	}
};

export type ForecastIconProps = {
	name: IconName;
	iconSet?: IconSet;
	className?: string;
} & Omit<React.SVGProps<SVGSVGElement>, 'name' | 'className'>;

export function ForecastIcon({
	name,
	iconSet = 'lucide',
	className = 'size-5',
	...props
}: ForecastIconProps) {
	const Icon = iconMaps[iconSet][name];
	return <Icon className={className} aria-hidden="true" {...props} />;
}

export default ForecastIcon;
