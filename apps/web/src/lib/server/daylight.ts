// NOAA's approximate solar-position equations, using UTC throughout so the
// longitude determines solar time independently of browser timezone and DST.
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
export function isDaylight(latitude: number, longitude: number, at = Date.now()): boolean {
	const date = new Date(at);
	const year = date.getUTCFullYear();
	const yearStart = Date.UTC(year, 0, 1);
	const daysInYear = (Date.UTC(year + 1, 0, 1) - yearStart) / 86400000;
	const fractionalDay = (at - yearStart) / 86400000;
	const gamma = ((2 * Math.PI) / daysInYear) * (fractionalDay - 0.5);
	const equationOfTime =
		229.18 *
		(0.000075 +
			0.001868 * Math.cos(gamma) -
			0.032077 * Math.sin(gamma) -
			0.014615 * Math.cos(2 * gamma) -
			0.040849 * Math.sin(2 * gamma));
	const declination =
		0.006918 -
		0.399912 * Math.cos(gamma) +
		0.070257 * Math.sin(gamma) -
		0.006758 * Math.cos(2 * gamma) +
		0.000907 * Math.sin(2 * gamma) -
		0.002697 * Math.cos(3 * gamma) +
		0.00148 * Math.sin(3 * gamma);
	const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
	const radians = Math.PI / 180;
	const hourAngle = ((utcMinutes + equationOfTime + 4 * longitude) / 4 - 180) * radians;
	const lat = latitude * radians;
	const cosineZenith =
		Math.sin(lat) * Math.sin(declination) +
		Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle);
	// Include refraction and the solar disk, matching the sunrise/sunset horizon.
	return cosineZenith > Math.cos(90.833 * radians);
}
