export type ForecastEntry = { time: number; label: string; summary: string; details: string };
export type ForecastDay = { key: string; label: string; entries: ForecastEntry[] };

/** Group supplied periods in the location's calendar, without inventing missing days. */
export function forecastDays(entries: ForecastEntry[], timeZone: string): ForecastDay[] {
	const key = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
	const label = new Intl.DateTimeFormat('en-US', {
		timeZone,
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	});
	const days = new Map<string, ForecastDay>();
	for (const entry of entries
		.filter((e) => Number.isFinite(e.time))
		.toSorted((a, b) => a.time - b.time)) {
		const id = key.format(entry.time);
		if (!days.has(id)) days.set(id, { key: id, label: label.format(entry.time), entries: [] });
		days.get(id)!.entries.push(entry);
	}
	return [...days.values()].slice(0, 7);
}
