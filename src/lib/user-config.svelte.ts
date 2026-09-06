import { getContext, setContext } from 'svelte';
import type { PackageManager } from './package-manager.js';
export type InstallationType = 'cli' | 'manual';
export class UserConfigContext {
	current = $state<{ packageManager: PackageManager; installationType: InstallationType }>({
		packageManager: 'pnpm',
		installationType: 'cli'
	});
	setConfig(config: { packageManager?: string; installationType?: InstallationType }) {
		if (config.installationType) this.current.installationType = config.installationType;
		if (config.packageManager && ['pnpm', 'npm', 'yarn', 'bun'].includes(config.packageManager)) {
			this.current.packageManager = config.packageManager as PackageManager;
			try {
				localStorage.setItem('wxcn-package-manager', config.packageManager);
			} catch {}
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
