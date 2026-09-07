import { getContext, setContext } from 'svelte';
const key = Symbol('wxcn-page');
class Page {
	url = $state(new URL('https://wxcn.dev'));
	constructor(url: string) {
		this.url = new URL(url);
	}
	get framework() {
		return this.url.pathname.startsWith('/react') ? 'react' : 'svelte';
	}
	get path() {
		return this.url.pathname.replace(/^\/react(?=\/|$)/, '') || '/';
	}
	href(path: string) {
		return this.framework === 'react' ? '/react' + (path === '/' ? '' : path) : path;
	}
	replace(url: URL) {
		history.replaceState(null, '', url);
		this.url = new URL(url);
	}
}
export function setPage(url: string) {
	return setContext(key, new Page(url));
}
export function getPage() {
	return getContext<Page>(key);
}
