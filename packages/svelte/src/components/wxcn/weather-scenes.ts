// Shared by both photographic and monochrome rendering. Coverage, mist, and
// precipitation are independent so, for example, drizzle never looks like a downpour.
const scene = (
	plate: 'fair' | 'overcast' | 'storm' | 'fog',
	coverage: number,
	mist = 0,
	rain = 0,
	snow = 0,
	wind = 1
) => ({ plate, coverage, mist, rain, snow, wind });
export const weatherScenes = {
	sunrise: scene('fair', 0.65),
	sunset: scene('fair', 0.65),
	clear: scene('fair', 0),
	'partly-cloudy': scene('fair', 0.85),
	haze: scene('fair', 0, 0.55),
	fog: scene('fog', 1, 0.65),
	wind: scene('fair', 0.6, 0.08, 0, 0, 3),
	cloudy: scene('overcast', 1),
	thunderstorm: scene('storm', 1, 0.12, 36, 0, 2.4),
	rain: scene('overcast', 1, 0.15, 24),
	'heavy-rain': scene('storm', 1, 0.3, 48, 0, 1.7),
	drizzle: scene('overcast', 1, 0.3, 10),
	snow: scene('overcast', 1, 0.25, 0, 20, 0.65),
	'heavy-snow': scene('overcast', 1, 0.6, 0, 40, 1.3),
	'wintry-mix': scene('overcast', 1, 0.3, 16, 14),
	'clear-night': scene('fair', 0),
	'partly-cloudy-night': scene('fair', 0.85),
	'drizzle-night': scene('overcast', 1, 0.3, 10)
};
