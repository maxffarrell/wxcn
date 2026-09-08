import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('../', import.meta.url);
const directory = await mkdtemp(join(tmpdir(), 'wxcn-vue-consumer-'));
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

const server = createServer(async (request, response) => {
	try {
		const path = new URL(request.url, 'http://localhost').pathname;
		if (!/^\/r\/vue\/[a-z-]+\.json$/.test(path)) {
			response.writeHead(404).end();
			return;
		}
		const content = await readFile(new URL(`apps/web/static${path}`, root), 'utf8');
		response.setHeader('content-type', 'application/json');
		response.end(
			content.replaceAll(
				'https://wxcn.dev/r/vue/',
				`http://127.0.0.1:${server.address().port}/r/vue/`
			)
		);
	} catch {
		response.writeHead(404).end();
	}
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

async function file(path, content) {
	await mkdir(join(directory, path, '..'), { recursive: true });
	await writeFile(
		join(directory, path),
		typeof content === 'string' ? content : JSON.stringify(content)
	);
}

try {
	await file('package.json', {
		name: 'wxcn-vue-consumer',
		private: true,
		type: 'module',
		scripts: { check: 'vue-tsc --noEmit', build: 'vite build' },
		dependencies: {
			'class-variance-authority': '^0.7.1',
			clsx: '^2.1.1',
			'tailwind-merge': '^3.6.0',
			'tw-animate-css': '^1.4.0',
			vue: '^3.5.42'
		},
		devDependencies: {
			'@tailwindcss/vite': '^4.3.3',
			'@types/node': '^26.5.0',
			'@vitejs/plugin-vue': '^6.0.2',
			tailwindcss: '^4.3.3',
			typescript: '^6.0.3',
			vite: '^8.2.2',
			'vue-tsc': '^3.2.5'
		}
	});
	await file('pnpm-workspace.yaml', 'allowBuilds:\n  esbuild: true\n  vue-demi: true\n');
	await file('components.json', {
		$schema: 'https://shadcn-vue.com/schema.json',
		style: 'new-york',
		font: 'inter',
		typescript: true,
		tailwind: {
			config: '',
			css: 'src/styles.css',
			baseColor: 'neutral',
			cssVariables: true,
			prefix: ''
		},
		iconLibrary: process.env.WXCN_ICON_LIBRARY ?? 'tabler',
		rtl: false,
		aliases: {
			components: '~/widgets',
			utils: '~/shared/cn',
			ui: '~/primitives',
			lib: '~/support',
			composables: '~/composables'
		}
	});
	await file('tsconfig.json', {
		compilerOptions: {
			target: 'ES2023',
			module: 'ESNext',
			moduleResolution: 'Bundler',
			strict: true,
			skipLibCheck: true,
			jsx: 'preserve',
			noEmit: true,
			paths: { '~/*': ['./src/*'] },
			types: ['vite/client']
		},
		include: ['src/**/*.ts', 'src/**/*.vue']
	});
	await file(
		'vite.config.ts',
		"import {defineConfig} from 'vite';import vue from '@vitejs/plugin-vue';import tailwind from '@tailwindcss/vite';import {fileURLToPath} from 'node:url';export default defineConfig({plugins:[vue(),tailwind()],resolve:{alias:{'~':fileURLToPath(new URL('./src',import.meta.url))}}});"
	);
	await file(
		'index.html',
		'<html lang="en"><div id="app"></div><script type="module" src="/src/main.ts"></script></html>'
	);
	await file(
		'src/main.ts',
		"import {createApp} from 'vue';import App from './App.vue';import './styles.css';createApp(App).mount('#app');"
	);
	await file(
		'src/App.vue',
		'<script setup lang="ts">import ForecastDashboard from "~/widgets/wxcn/ForecastDashboard.vue";</script><template><ForecastDashboard /></template>'
	);
	await file(
		'src/styles.css',
		`@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-destructive: var(--destructive);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
`
	);
	await file(
		'src/shared/cn.ts',
		"import { clsx, type ClassValue } from 'clsx';import { twMerge } from 'tailwind-merge';export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }\n"
	);
	await file('src/vite-env.d.ts', '/// <reference types="vite/client" />\n');

	await run(['install', '--no-frozen-lockfile']);
	await run([
		'dlx',
		'--allow-build=vue-demi',
		'shadcn-vue@2.8.2',
		'add',
		`http://127.0.0.1:${server.address().port}/r/vue/forecast-dashboard.json`,
		'--yes'
	]);
	await readFile(join(directory, 'src/widgets/wxcn/ForecastDashboard.vue'));
	await readFile(join(directory, 'src/support/wxcn/types.ts'));
	const icons = await readFile(join(directory, 'src/widgets/wxcn/ForecastIcon.vue'), 'utf8');
	assert.match(icons, /IconArrowDown.*from ['"]@tabler\/icons-vue['"]/s);
	assert.match(icons, /CloudRainIcon, CloudSunIcon.*from ['"]wxcn-lucide['"]/s);
	assert.match(icons, /<WavesIcon .*name === ['"]tide['"]/);
	assert.doesNotMatch(icons, /ActivityIcon|CircleDashedIcon/);
	await run(['check']);
	await run(['build']);
	console.log(
		'Vue clean-consumer CLI install, custom aliases, icon transform, typecheck and build passed.'
	);
} finally {
	server.close();
	await rm(directory, { recursive: true, force: true });
}
