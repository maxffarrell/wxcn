import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsx } from 'mdsx';

const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		vitePreprocess(),
		mdsx({
			blueprints: {
				default: {
					path: 'src/lib/blueprints/docs/blueprint.svelte'
				}
			}
		})
	],
	kit: {
		adapter: adapter(),
		alias: {
			$components: 'src/lib/components',
			$wxcn: 'src/lib/components/wxcn'
		}
	}
};

export default config;
