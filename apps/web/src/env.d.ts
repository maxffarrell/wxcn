/// <reference types="astro/client" />
declare module '*.svx' {
	const component: import('svelte').Component<any>;
	export default component;
}
