export const presetOptions = {
	style: ['nova'],
	base: ['neutral', 'stone', 'zinc', 'gray'],
	theme: ['neutral', 'blue', 'green', 'orange'],
	chart: ['theme', 'blue', 'green', 'orange'],
	font: ['geist', 'system', 'serif', 'mono'],
	heading: ['geist', 'system', 'serif', 'mono'],
	icons: ['lucide', 'tabler', 'hugeicons', 'phosphor-svelte', 'remix'],
	radius: ['0rem', '0.5rem', '0.75rem', '1rem'],
	density: ['comfortable', 'compact'],
	temperature: ['fahrenheit', 'celsius'],
	tide: ['ft', 'meter'],
	wind: ['mph', 'km/h', 'm/s', 'knots'],
	animation: ['on', 'off'],
	scene: ['live', 'clear', 'clouds', 'rain', 'snow', 'night']
} as const;
export type Preset = { -readonly [K in keyof typeof presetOptions]: string };
export function encodePreset(value: Preset) {
	return (
		'wx1.' +
		Object.keys(presetOptions)
			.map((k) =>
				(presetOptions[k as keyof Preset] as readonly string[])
					.indexOf(value[k as keyof Preset])
					.toString(36)
			)
			.join('')
	);
}
export function decodePreset(raw: string): Preset | null {
	const code = raw.trim().replace(/^--preset\s+/, '');
	if (!/^wx1\.[0-9a-z]+$/.test(code) || code.length !== 4 + Object.keys(presetOptions).length)
		return null;
	const result = {} as Preset;
	for (const [i, key] of Object.keys(presetOptions).entries()) {
		const k = key as keyof Preset;
		const option = (presetOptions[k] as readonly string[])[parseInt(code[i + 4], 36)];
		if (!option) return null;
		result[k] = option;
	}
	return result;
}
