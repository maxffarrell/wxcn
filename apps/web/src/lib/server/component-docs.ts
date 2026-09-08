import docs from './generated/component-docs.json';
import reactDocs from './generated/component-docs-react.json';
import vueDocs from './generated/component-docs-vue.json';

export async function load(framework: 'svelte' | 'react' | 'vue' = 'svelte') {
	return framework === 'react' ? reactDocs : framework === 'vue' ? vueDocs : docs;
}
