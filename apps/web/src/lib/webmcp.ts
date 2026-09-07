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

const navigationSchema = {
	type: 'object',
	properties: {
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
			if (!page || !(page in pages)) {
				throw new Error('Choose a valid wxcn page.');
			}

			window.location.assign(pages[page].href);
			return `Opening ${pages[page].title}.`;
		}
	},
	{
		name: 'list_wxcn_pages',
		description: 'List the public pages available on wxcn.',
		inputSchema: {
			type: 'object',
			properties: {},
			additionalProperties: false
		},
		annotations: { readOnlyHint: true, destructiveHint: false },
		async execute() {
			return Object.entries(pages).map(([id, page]) => ({ id, ...page }));
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
