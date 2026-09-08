<script lang="ts">
	import { onMount, settled, untrack } from 'svelte';
	import { createSSRApp, h, shallowRef, type Component } from 'vue';
	import { renderToString } from '@vue/server-renderer';
	import WeatherForecast from '@wxcn/vue/components/wxcn/WeatherForecast.vue';
	import MoonForecast from '@wxcn/vue/components/wxcn/MoonForecast.vue';
	import TideForecast from '@wxcn/vue/components/wxcn/TideForecast.vue';
	import ForecastDashboard from '@wxcn/vue/components/wxcn/ForecastDashboard.vue';
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
	function normalized() {
		const { iconType, ...rest } = props;
		return {
			...rest,
			iconType:
				iconType === 'phosphor-svelte' ? 'phosphor' : iconType === 'remix' ? 'remixicon' : iconType
		};
	}
	const initial = untrack(() => ({ kind, props: normalized() }));
	function createApp(state: { value: typeof initial }) {
		const app = createSSRApp({
			render: () => h(components[state.value.kind] as Component, state.value.props)
		});
		app.config.idPrefix = prefix;
		return app;
	}
	let element: HTMLDivElement;
	const current = shallowRef(initial);
	let hydrated = $state(false);
	onMount(() => {
		let active = true;
		const app = createApp(current);
		void settled().then(() => {
			if (!active) return;
			app.mount(element.querySelector<HTMLElement>('[data-vue-root]')!);
			hydrated = true;
		});
		return () => {
			active = false;
			if (hydrated) app.unmount();
		};
	});
	$effect(() => {
		const value = { kind, props: normalized() };
		if (hydrated) current.value = value;
	});
	const markup = await renderToString(createApp({ value: initial }));
</script>

<div bind:this={element} data-vue-forecast={kind} data-vue-hydrated={hydrated || undefined}>
	{@html `<div data-vue-root style="display:contents">${markup}</div>`}
</div>
