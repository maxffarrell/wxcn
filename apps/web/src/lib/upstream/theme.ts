import { BASE_THEMES, THEMES } from './themes.js';
import { PRESET_RADII, type PresetConfig } from 'shadcn-svelte/preset';
type DesignSystemConfig = PresetConfig;
const RADII = Object.values(PRESET_RADII);
const getBaseColor = (name: string) => BASE_THEMES.find((t) => t.name === name);
const getTheme = (name: string | undefined) => THEMES.find((t) => t.name === name);
export function buildRegistryTheme(config: DesignSystemConfig) {
	const baseColor = getBaseColor(config.baseColor);
	const theme = getTheme(config.theme);

	if (!baseColor || !theme) {
		throw new Error(`Base color "${config.baseColor}" or theme "${config.theme}" not found`);
	}

	// Merge base color and theme CSS vars.
	const lightVars: Record<string, string> = {
		...(baseColor.cssVars?.light as Record<string, string>),
		...(theme.cssVars?.light as Record<string, string>)
	};
	const darkVars: Record<string, string> = {
		...(baseColor.cssVars?.dark as Record<string, string>),
		...(theme.cssVars?.dark as Record<string, string>)
	};
	const themeVars: Record<string, string> = {};

	// Apply chart color override.
	const chartTheme = getTheme(config.chartColor);
	if (chartTheme) {
		const chartLight = chartTheme.cssVars?.light as Record<string, string>;
		const chartDark = chartTheme.cssVars?.dark as Record<string, string>;
		for (let i = 1; i <= 5; i++) {
			const key = `chart-${i}`;
			if (chartLight?.[key]) lightVars[key] = chartLight[key];
			if (chartDark?.[key]) darkVars[key] = chartDark[key];
		}
	}

	// Apply menu accent transformation.
	if (config.menuAccent === 'bold') {
		lightVars.accent = lightVars.primary;
		lightVars['accent-foreground'] = lightVars['primary-foreground'];
		darkVars.accent = darkVars.primary;
		darkVars['accent-foreground'] = darkVars['primary-foreground'];
		// lightVars["sidebar-accent"] = lightVars.primary
		// lightVars["sidebar-accent-foreground"] = lightVars["primary-foreground"]
		// darkVars["sidebar-accent"] = darkVars.primary
		// darkVars["sidebar-accent-foreground"] = darkVars["primary-foreground"]
	}

	// Apply radius transformation.
	if (config.radius && config.radius !== 'default') {
		const radius = RADII.find((r) => r.name === config.radius);
		if (radius && radius.value) {
			lightVars.radius = radius.value;
		}
	}

	return {
		name: `${config.baseColor}-${config.theme}`,
		type: 'registry:theme' as const,
		cssVars: {
			theme: Object.keys(themeVars).length > 0 ? themeVars : undefined,
			light: lightVars,
			dark: darkVars
		}
	};
}
