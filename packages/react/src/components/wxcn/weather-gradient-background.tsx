import type { SkyState } from '@wxcn/core/sky.js';
import type { CSSProperties } from 'react';
import type { WeatherShaderMode } from './weather-shader-background';

export function WeatherGradientBackground({
	mode = 'clear',
	sky = null
}: {
	mode?: WeatherShaderMode;
	sky?: SkyState | null;
}) {
	const period =
		sky?.period ??
		(mode.includes('night') ? 'night' : mode === 'sunrise' || mode === 'sunset' ? mode : 'midday');
	const weather = /rain|drizzle|thunderstorm|wintry/.test(mode)
		? 'rain'
		: /snow/.test(mode)
			? 'snow'
			: /cloudy|fog|haze/.test(mode)
				? 'cloud'
				: 'clear';
	const z = sky ? 2 * sky.moon.illumination - 1 : -1;
	const moonPath = `M0 -1 A1 1 0 0 1 0 1 L${Array.from({ length: 65 }, (_, i) => {
		const y = 1 - i / 32;
		return `${-z * Math.sqrt(Math.max(0, 1 - y * y))} ${y}`;
	}).join(' L')} Z`;
	const moonAngle = sky ? (Math.atan2(-sky.moon.light[1], sky.moon.light[0]) * 180) / Math.PI : 0;
	const style = {
		'--sun-x': `${(sky?.sun.x ?? 0.8) * 100}%`,
		'--sun-y': `${(1 - (sky?.sun.y ?? 0.76)) * 100}%`
	} as CSSProperties;
	return (
		<div
			className="wxcn-weather-gradient"
			data-background-style="gradient"
			data-sky-period={period}
			data-weather={weather}
			style={style}
			aria-hidden="true"
		>
			{sky?.sun.visible && (
				<span
					className="wxcn-gradient-sun"
					style={{ left: `${sky.sun.x * 100}%`, top: `${(1 - sky.sun.y) * 100}%` }}
				/>
			)}
			{sky?.moon.visible && (
				<svg
					className="wxcn-gradient-moon"
					viewBox="-1 -1 2 2"
					style={{
						left: `${sky.moon.x * 100}%`,
						top: `${(1 - sky.moon.y) * 100}%`,
						transform: `translate(-50%,-50%) rotate(${moonAngle}deg)`
					}}
				>
					<path d={moonPath} fill="#d9dee6" />
				</svg>
			)}
			<style>{`
.wxcn-weather-gradient{position:absolute;inset:0;overflow:hidden;container-type:size;background:radial-gradient(ellipse at var(--sun-x) var(--sun-y),#f5dba560,transparent 45%),linear-gradient(180deg,#32658b,#88b4c3)}
.wxcn-weather-gradient[data-sky-period=night]{background:linear-gradient(180deg,#0c1428,#29394f)}
.wxcn-weather-gradient[data-sky-period=sunrise]{background:radial-gradient(ellipse at var(--sun-x) var(--sun-y),#edab8370,transparent 65%),linear-gradient(180deg,#475575,#bd8290 70%,#dda472)}
.wxcn-weather-gradient[data-sky-period=sunset]{background:radial-gradient(ellipse at var(--sun-x) var(--sun-y),#fba44780,transparent 65%),linear-gradient(180deg,#424760,#b4716b 70%,#d39866)}
.wxcn-weather-gradient:after{content:'';position:absolute;inset:0;pointer-events:none}.wxcn-weather-gradient[data-weather=cloud]:after{background:#71818b55}.wxcn-weather-gradient[data-weather=rain]:after{background:#263c52aa}.wxcn-weather-gradient[data-weather=snow]:after{background:#a4b8c455}
.wxcn-gradient-sun,.wxcn-gradient-moon{position:absolute;transform:translate(-50%,-50%)}.wxcn-gradient-sun{width:3.2cqh;height:3.2cqh;border-radius:50%;background:#fff0bd;box-shadow:0 0 3cqh #f4c98966}.wxcn-gradient-moon{width:4.4cqh;height:4.4cqh}
`}</style>
		</div>
	);
}

export default WeatherGradientBackground;
