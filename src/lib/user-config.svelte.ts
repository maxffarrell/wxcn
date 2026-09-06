import { getContext, setContext } from 'svelte';
import type { PackageManager } from './package-manager.js';
export class UserConfigContext {
	current = $state<{ packageManager: PackageManager }>({ packageManager: 'pnpm' });
	setConfig(config: { packageManager: string }) {
		if (!['pnpm', 'npm', 'yarn', 'bun'].includes(config.packageManager)) return;
		this.current.packageManager = config.packageManager as PackageManager;
		try {
			localStorage.setItem('wxcn-package-manager', config.packageManager);
		} catch {
			/* Storage is optional. */
		}
	}
	static set() {
		const state = new UserConfigContext();
		setContext('wxcn-pm', state);
		return state;
	}
	static get(): UserConfigContext {
		return getContext('wxcn-pm');
	}
}
