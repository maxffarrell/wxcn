import { mkdir, symlink, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const workspaces = ['apps/web', 'packages/svelte', 'packages/react'];
const overlay = `${root}node_modules/.cache/svelte-check-native/svelte`;

// Preserve each pnpm package's dependency resolution inside native TS overlays.
async function linkDependencies() {
	for (const workspace of workspaces) {
		const directory = `${overlay}/${workspace}`;
		await mkdir(directory, { recursive: true });
		try {
			await symlink(`${root}${workspace}/node_modules`, `${directory}/node_modules`, 'dir');
		} catch (error) {
			if (error.code !== 'EEXIST') throw error;
		}
	}
}
function check() {
	const result = spawnSync(
		`${root}apps/web/node_modules/.bin/svelte-check-native`,
		['--workspace', root, '--tsconfig', 'tsconfig.svelte.json'],
		{ cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
	);
	if (result.error) throw result.error;
	return result;
}
await linkDependencies();
let result = check();
// The checker clears its overlay on a cold cache or compiler upgrade. Restore
// package resolution and run the full check again; its diagnostics are authoritative.
if (!(await lstat(`${overlay}/${workspaces[0]}/node_modules`).catch(() => null))) {
	await linkDependencies();
	result = check();
}
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exitCode = result.status ?? 1;
