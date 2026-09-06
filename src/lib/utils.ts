import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatTime(value: string | Date, options: Intl.DateTimeFormatOptions = {}) {
	const date = typeof value === 'string' ? new Date(value) : value;
	return new Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		...options
	}).format(date);
}
