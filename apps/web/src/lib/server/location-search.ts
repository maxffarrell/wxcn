import places from './places.json' with { type: 'json' };
const normalize = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
const index = places.map(([label, latitude, longitude]) => ({
	label: String(label),
	latitude: Number(latitude),
	longitude: Number(longitude),
	search: normalize(String(label))
}));
export function searchLocations(query: string) {
	const terms = normalize(query.slice(0, 100)).split(' ').filter(Boolean);
	if (terms.join('').length < 2) return [];
	return index
		.filter((p) => terms.every((term) => p.search.split(' ').some((word) => word.startsWith(term))))
		.sort((a, b) => a.label.length - b.label.length || a.label.localeCompare(b.label))
		.slice(0, 8)
		.map(({ label, latitude, longitude }) => ({ label, latitude, longitude }));
}
