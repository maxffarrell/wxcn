/// <reference types="astro/client" />

interface Navigator {
	modelContext?: {
		provideContext(context: {
			tools: Array<{
				name: string;
				description: string;
				inputSchema: Record<string, unknown>;
				annotations?: Record<string, boolean>;
				execute: (input: unknown) => Promise<unknown>;
			}>;
		}): void;
	};
}
declare module '*.svx' {
	const component: import('svelte').Component<any>;
	export default component;
}

declare module '*.vue' {
	const component: import('vue').Component;
	export default component;
}
