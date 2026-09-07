import { getContext, setContext } from 'svelte';
const key = Symbol('wxcn-page');
class Page {
	url = $state(new URL('https://wxcn.dev'));
	constructor(url: string) {
		this.url = new URL(url);
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
