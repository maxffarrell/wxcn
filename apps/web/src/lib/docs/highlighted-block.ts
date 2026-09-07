export type HighlightedBlock = {
	name: string;
	files: {
		target: string;
		type: 'registry:component' | 'registry:lib';
		content: string;
		highlightedContent: string;
	}[];
};
