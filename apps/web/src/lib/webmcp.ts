const pages = {
	home: { title: 'Home', href: '/' },
	components: { title: 'Components', href: '/docs/components' },
	dataSources: { title: 'Data sources', href: '/docs/endpoints' }
} as const;

type PageName = keyof typeof pages;

type WebMCPTool = {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
	annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean };
	execute: (input: unknown) => Promise<unknown>;
};

type ModelContext = {
	provideContext: (context: { tools: WebMCPTool[] }) => void;
};

const frameworkProperty = {
	type: 'string',
	enum: ['svelte', 'react', 'vue'],
	description: 'Framework to navigate or list. Defaults to the current framework.'
};

function frameworkPrefix(input: unknown): string {
	const framework =
		input && typeof input === 'object' && 'framework' in input ? input.framework : undefined;
	if (
		framework !== undefined &&
		framework !== 'svelte' &&
		framework !== 'react' &&
		framework !== 'vue'
	) {
		throw new Error('Choose Svelte, React, or Vue.');
	}
	const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
	const current =
		pathname === '/react' || pathname.startsWith('/react/')
			? 'react'
			: pathname === '/vue' || pathname.startsWith('/vue/')
				? 'vue'
				: 'svelte';
	const selected = framework ?? current;
	return selected === 'svelte' ? '' : `/${selected}`;
}

function pageHref(href: string, prefix: string) {
	return prefix + (href === '/' ? (prefix ? '' : '/') : href);
}

const navigationSchema = {
	type: 'object',
	properties: {
		framework: frameworkProperty,
		page: {
			type: 'string',
			enum: Object.keys(pages),
			description: 'The wxcn page to open.'
		}
	},
	required: ['page'],
	additionalProperties: false
};

export const webmcpTools: WebMCPTool[] = [
	{
		name: 'navigate_to_wxcn_page',
		description: 'Open one of the wxcn public pages. This only navigates within wxcn.',
		inputSchema: navigationSchema,
		annotations: { readOnlyHint: true, destructiveHint: false },
		async execute(input) {
			const page = (input as { page?: PageName }).page;
			if (!page || !Object.hasOwn(pages, page)) {
				throw new Error('Choose a valid wxcn page.');
			}

			window.location.assign(pageHref(pages[page].href, frameworkPrefix(input)));
			return `Opening ${pages[page].title}.`;
		}
	},
	{
		name: 'list_wxcn_pages',
		description: 'List the public pages available on wxcn.',
		inputSchema: {
			type: 'object',
			properties: { framework: frameworkProperty },
			additionalProperties: false
		},
		annotations: { readOnlyHint: true, destructiveHint: false },
		async execute(input) {
			const prefix = frameworkPrefix(input);
			return Object.entries(pages).map(([id, page]) => ({
				id,
				...page,
				href: pageHref(page.href, prefix)
			}));
		}
	}
];

export function registerWebMCP(): () => void {
	if (typeof navigator === 'undefined') return () => {};

	const modelContext = (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
	if (!modelContext?.provideContext) return () => {};

	modelContext.provideContext({ tools: webmcpTools });
	return () => modelContext.provideContext({ tools: [] });
}
