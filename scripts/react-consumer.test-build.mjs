import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const directory = await mkdtemp(join(tmpdir(), 'wxcn-react-consumer-'));
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
		const path = new URL(req.url, 'http://localhost').pathname;
		if (!/^\/r\/react\/[a-z-]+\.json$/.test(path)) {
			res.writeHead(404).end();
			return;
		}
		const content = await readFile(new URL(`apps/web/static${path}`, root), 'utf8');
		res.setHeader('content-type', 'application/json');
		res.end(
			content.replaceAll(
				'https://wxcn.dev/r/react/',
				`http://127.0.0.1:${server.address().port}/r/react/`
			)
		);
	} catch {
		res.writeHead(404).end();
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
	const preview = JSON.parse(
		await readFile(new URL('apps/preview-react/package.json', root), 'utf8')
	);
	await file('package.json', {
		name: 'wxcn-react-consumer',
		private: true,
		type: 'module',
		scripts: { check: 'tsc --noEmit', build: 'vite build' },
		dependencies: {
			'class-variance-authority': '^0.7.1',
			cn: '^0.2.5',
			react: preview.dependencies.react,
			'react-dom': preview.dependencies['react-dom']
		},
		devDependencies: preview.devDependencies
	});
	await file('pnpm-workspace.yaml', 'allowBuilds:\n  esbuild: true\n');
	await file('tsconfig.json', {
		compilerOptions: {
			target: 'ES2023',
			lib: ['ES2023', 'DOM', 'DOM.Iterable'],
			module: 'ESNext',
			moduleResolution: 'Bundler',
			jsx: 'react-jsx',
			strict: true,
			skipLibCheck: true,
			noEmit: true,
			paths: { '~/*': ['./src/*'] }
		},
		include: ['src']
	});
	await file('components.json', {
		$schema: 'https://ui.shadcn.com/schema.json',
		style: 'new-york',
		rsc: true,
		tsx: true,
		tailwind: { config: '', css: 'src/styles.css', baseColor: 'neutral', cssVariables: true },
		aliases: {
			components: '~/widgets',
			ui: '~/primitives',
			utils: '~/helpers/cn',
			lib: '~/helpers',
			hooks: '~/hooks'
		},
		iconLibrary: 'lucide'
	});
	await file('src/helpers/cn.ts', "export { cn } from 'cn';\n");
	await file(
		'src/styles.css',
		await readFile(new URL('apps/preview-react/src/styles.css', root), 'utf8')
	);
	await file('src/vite-env.d.ts', '/// <reference types="vite/client" />\n');
	await file(
		'index.html',
		'<html lang="en"><div id="root"></div><script type="module" src="/src/main.tsx"></script></html>'
	);
	await file(
		'vite.config.ts',
		"import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';import tailwind from '@tailwindcss/vite';import {fileURLToPath} from 'node:url';export default defineConfig({plugins:[react(),tailwind()],resolve:{alias:{'~':fileURLToPath(new URL('./src',import.meta.url))}}});"
	);
	await file(
		'src/main.tsx',
		"import {createRoot} from 'react-dom/client';import {ForecastDashboard} from '~/widgets/wxcn/forecast-dashboard';import './styles.css';createRoot(document.getElementById('root')!).render(<ForecastDashboard />);"
	);
	await run(['install']);
	await run([
		'exec',
		fileURLToPath(new URL('node_modules/shadcn/dist/index.js', root)),
		'add',
		`http://127.0.0.1:${server.address().port}/r/react/forecast-dashboard.json`,
		'--yes'
	]);
	// The public CLI must resolve both file targets and imports through custom aliases.
	await readFile(join(directory, 'src/widgets/wxcn/forecast-dashboard.tsx'));
	await readFile(join(directory, 'src/helpers/wxcn/types.ts'));
	await run(['check']);
	await run(['build']);
	console.log(
		'React clean-consumer CLI install, custom aliases, typecheck and production build passed.'
	);
} finally {
	server.close();
	await rm(directory, { recursive: true, force: true });
}
