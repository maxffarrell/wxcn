import docs from './generated/component-docs.json';
import reactDocs from './generated/component-docs-react.json';

export async function load(framework: 'svelte' | 'react' = 'svelte') {
	return framework === 'react' ? reactDocs : docs;
}
