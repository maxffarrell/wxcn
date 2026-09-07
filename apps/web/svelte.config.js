import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsx } from 'mdsx';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';

const config = {
	extensions: ['.svelte', '.svx'],
	preprocess: [
		vitePreprocess(),
		mdsx({
			extensions: ['.svx'],
			remarkPlugins: [remarkGfm],
			rehypePlugins: [
				rehypeSlug,
				[
					rehypePrettyCode,
					{ theme: { light: 'github-light', dark: 'github-dark' }, keepBackground: false }
				]
			],
			blueprints: {
				default: {
					path: 'src/blueprints/docs/blueprint.svelte'
				}
			}
		})
	]
};

export default config;
