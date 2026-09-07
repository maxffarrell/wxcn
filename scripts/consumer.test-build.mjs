// Integration gate: install the generated registry using the real CLI in a fresh project.
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
const root = new URL('../', import.meta.url);
const web = JSON.parse(await readFile(new URL('apps/web/package.json', root), 'utf8'));
const directory = await mkdtemp(join(tmpdir(), 'wxcn-install-'));
const run = (args) =>
	new Promise((resolve, reject) => {
		const child = spawn('pnpm', args, {
			cwd: directory,
			stdio: 'inherit',
			env: { ...process.env, CI: 'true' }
		});
		child.on('error', reject);
		child.on('exit', (code) =>
			code === 0 ? resolve() : reject(new Error(`pnpm ${args.join(' ')} exited ${code}`))
		);
	});
const server = createServer(async (req, res) => {
	try {
		const name = new URL(req.url, 'http://localhost').pathname;
		if (!/^\/r\/(?:svelte\/)?[a-z-]+\.json$/.test(name)) {
			res.writeHead(404).end();
			return;
		}
		res.setHeader('content-type', 'application/json');
		res.end(await readFile(new URL(`apps/web/static${name}`, root)));
	} catch {
		res.writeHead(404).end();
	}
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
async function file(path, content) {
	await mkdir(join(directory, path, '..'), { recursive: true });
	await writeFile(
		join(directory, path),
		typeof content === 'string' ? content : JSON.stringify(content)
	);
}
try {
	await file(
		'pnpm-workspace.yaml',
		"allowBuilds:\n  esbuild: true\n  '@hugeicons/svelte': false\n"
	);
	await file('package.json', {
		name: 'wxcn-clean-consumer',
		private: true,
		type: 'module',
		scripts: { check: 'svelte-check --tsconfig ./tsconfig.json', build: 'vite build' },
		devDependencies: Object.fromEntries(
			[
				'svelte',
				'svelte-check',
				'typescript',
				'vite',
				'@sveltejs/vite-plugin-svelte',
				'@tailwindcss/vite',
				'tailwindcss',
				'@types/node'
			].map((name) => [name, web.devDependencies[name]])
		),
		dependencies: {
			clsx: web.dependencies.clsx,
			'tailwind-merge': web.dependencies['tailwind-merge']
		}
	});
	await file('components.json', {
		$schema: 'https://shadcn-svelte.com/schema.json',
		style: 'nova',
		tailwind: { css: 'src/app.css', baseColor: 'neutral' },
		aliases: {
			components: '$lib/components',
			ui: '$lib/components/ui',
			utils: '$lib/utils',
			hooks: '$lib/hooks',
			lib: '$lib'
		},
		typescript: true,
		iconLibrary: 'hugeicons'
	});
	await file('tsconfig.json', {
		compilerOptions: {
			target: 'ESNext',
			module: 'ESNext',
			moduleResolution: 'Bundler',
			strict: true,
			skipLibCheck: true,
			allowJs: true,
			paths: { '$lib/*': ['./src/lib/*'] }
		},
		include: ['src/**/*.ts', 'src/**/*.svelte']
	});
	await file(
		'svelte.config.js',
		"import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'; export default { preprocess: vitePreprocess() };"
	);
	await file(
		'vite.config.ts',
		"import { defineConfig } from 'vite'; import { svelte } from '@sveltejs/vite-plugin-svelte'; import tailwindcss from '@tailwindcss/vite'; import { fileURLToPath } from 'node:url'; export default defineConfig({ plugins: [svelte(), tailwindcss()], resolve: { alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) } } });"
	);
	await file(
		'index.html',
		'<html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>'
	);
	await file(
		'src/main.ts',
		"import { mount } from 'svelte'; import App from './App.svelte'; import './app.css'; mount(App, { target: document.getElementById('app')! });"
	);
	await file(
		'src/App.svelte',
		'<script>import ForecastDashboard from "$lib/components/wxcn/ForecastDashboard.svelte";</script><ForecastDashboard animatedWeatherBackground />'
	);
	await file('src/vite-env.d.ts', '/// <reference types="vite/client" />');
	await file('src/app.css', '@import "tailwindcss";');
	await file(
		'src/lib/utils.ts',
		await readFile(new URL('packages/svelte/src/utils.ts', root), 'utf8')
	);
	await run(['install', '--no-frozen-lockfile']);
	await run([
		'dlx',
		`shadcn-svelte@${web.devDependencies['shadcn-svelte'].replace('^', '')}`,
		'add',
		`http://127.0.0.1:${port}/r/svelte/forecast-dashboard.json`,
		'--yes'
	]);
	await run(['check']);
	await run(['build']);
	console.log('Clean consumer: native CLI install, type check, and build passed.');
} finally {
	server.close();
	await rm(directory, { recursive: true, force: true });
}
