import { getContext, setContext } from 'svelte';
const key = Symbol('wxcn-page');
class Page {
	url = $state(new URL('https://wxcn.dev'));
	constructor(url: string) {
		this.url = new URL(url);
	}
	get framework() {
		return /^\/react(?:\/|$)/.test(this.url.pathname)
			? 'react'
			: /^\/vue(?:\/|$)/.test(this.url.pathname)
				? 'vue'
				: 'svelte';
	}
	get path() {
		return this.url.pathname.replace(/^\/(react|vue)(?=\/|$)/, '') || '/';
	}
	href(path: string) {
		return this.framework !== 'svelte' ? '/' + this.framework + (path === '/' ? '' : path) : path;
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
