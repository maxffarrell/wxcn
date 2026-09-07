import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// Workspace primitives and app-level triggers must share the same context instance.
	resolve: { dedupe: ['svelte', 'bits-ui'] },
	plugins: [tailwindcss(), sveltekit()]
});
