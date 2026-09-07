import { mkdir, writeFile, access } from 'node:fs/promises';
// Wrangler's supported deploy redirect keeps its default root command pointed at
// Astro's generated Worker config, including bindings and bundled assets.
await access(new URL('../../apps/web/dist/server/wrangler.json', import.meta.url));
const directory = new URL('../../.wrangler/deploy/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(
	new URL('config.json', directory),
	JSON.stringify({
		configPath: '../../apps/web/dist/server/wrangler.json'
	})
);
