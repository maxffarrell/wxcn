<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { createElement, useEffect, type ReactNode, type ComponentType } from 'react';
	import { hydrateRoot, type Root } from 'react-dom/client';
	import { renderToString } from 'react-dom/server.browser';
	import { WeatherForecast, MoonForecast, TideForecast, ForecastDashboard } from '@wxcn/react';
	let {
		kind,
		props = {}
	}: { kind: 'weather' | 'moon' | 'tides' | 'dashboard'; props?: Record<string, unknown> } =
		$props();
	const components = {
		weather: WeatherForecast,
		moon: MoonForecast,
		tides: TideForecast,
		dashboard: ForecastDashboard
	};
	const prefix = $props.id();
	let element: HTMLDivElement;
	let root: Root | undefined;
	let hydrated = $state(false);
	function HydrationBoundary({ children }: { children: ReactNode }) {
		useEffect(() => {
			hydrated = true;
		}, []);
		return children;
	}
	function node() {
		const { iconType, ...rest } = props;
		const nativeIconType =
			iconType === 'phosphor-svelte' ? 'phosphor' : iconType === 'remix' ? 'remixicon' : iconType;
		return createElement(HydrationBoundary, {
			children: createElement(components[kind] as ComponentType<Record<string, unknown>>, {
				...rest,
				...(kind === 'weather' || kind === 'tides' || kind === 'dashboard' || kind === 'moon'
					? { iconType: nativeIconType }
					: {})
			})
		});
	}
	// Hydration must use the same props snapshot as the server-rendered markup.
	// The parent can update location, moon data, or presets before this mounts.
	const initial = untrack(node);
	const markup = renderToString(initial, { identifierPrefix: prefix });
	onMount(() => {
		root = hydrateRoot(element, initial, { identifierPrefix: prefix });
		return () => {
			root?.unmount();
			root = undefined;
		};
	});
	$effect(() => {
		const content = node();
		if (hydrated) root?.render(content);
	});
</script>

<div bind:this={element} data-react-forecast={kind}>{@html markup}</div>
