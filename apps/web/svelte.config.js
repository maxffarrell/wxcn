import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsx } from 'mdsx';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';

const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		vitePreprocess(),
		mdsx({
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
	],
	kit: {
		adapter: adapter({
			runtime: 'nodejs24.x'
		}),
		alias: {
			$components: 'src/lib/components',
			$frameworks: '../../tooling/contracts/frameworks.json',
			$wxcn: '../../packages/svelte/src/components/wxcn'
		}
	}
};

export default config;
