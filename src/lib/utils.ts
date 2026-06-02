import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
