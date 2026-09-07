import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
	session: false,
	site: 'https://wxcn.dev',
	output: 'server',
	publicDir: './static',
	integrations: [svelte({ extensions: ['.svelte', '.svx'] })],
	adapter: cloudflare({ imageService: 'passthrough' }),
	vite: {
		// Prebundle the server renderer before workerd starts; discovering it later
		// invalidates the worker dependency graph during a cold development start.
		environments: {
			ssr: {
				optimizeDeps: { include: ['@astrojs/svelte/server.js', 'astro/assets/services/noop'] }
			}
		},
		plugins: [tailwindcss()],
		resolve: {
			dedupe: ['svelte', 'bits-ui'],
			alias: {
				$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
				$components: fileURLToPath(new URL('./src/lib/components', import.meta.url)),
				$frameworks: fileURLToPath(
					new URL('../../tooling/contracts/frameworks.json', import.meta.url)
				),
				$wxcn: fileURLToPath(new URL('../../packages/svelte/src/components/wxcn', import.meta.url))
			}
		}
	}
});
