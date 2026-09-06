import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsx } from 'mdsx';

const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		vitePreprocess(),
		mdsx({
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
			$wxcn: 'src/lib/components/wxcn'
		}
	}
};

export default config;
