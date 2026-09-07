'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, CloudRain, CloudSun, Moon, Snowflake, Sun, Wind } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WeatherShaderBackground, type WeatherShaderMode } from './weather-shader-background';
import type {
	ForecastType,
	LocationInput,
	WeatherPeriod,
	CurrentWeather,
	WeatherUnit
} from '@wxcn/core/types.js';
import { sampleWeather, sampleCurrentWeather, convertWindSpeed } from '@wxcn/core/weather.js';
import { weatherOutlook } from '@wxcn/core/weather-outlook.js';

export interface WeatherForecastProps {
	timeZone?: string;
	type?: ForecastType;
	size?: 'sm' | 'default' | 'lg';
	density?: 'compact' | 'comfortable';
	className?: string;
	unit?: WeatherUnit;
	location?: LocationInput;
	forecast?: WeatherPeriod[];
	currentWeather?: CurrentWeather | null;
	showTemperatureTrend?: boolean;
	showHighLow?: boolean;
	at?: number;
	sourceLabel?: string;
	windUnit?: 'mph' | 'km/h' | 'm/s' | 'knots';
	animatedBackground?: boolean;
}

function condition(p: WeatherPeriod): WeatherShaderMode {
	const s = p.shortForecast.toLowerCase();
	if (/thunder|storm/.test(s)) return 'thunderstorm';
	if (/sleet|freezing|wintry/.test(s)) return 'wintry-mix';
	if (/snow/.test(s)) return s.includes('heavy') ? 'heavy-snow' : 'snow';
	if (/drizzle/.test(s)) return p.isDaytime ? 'drizzle' : 'drizzle-night';
	if (/rain|shower/.test(s)) return s.includes('heavy') ? 'heavy-rain' : 'rain';
	if (/fog/.test(s)) return 'fog';
	if (/haze|smoke/.test(s)) return 'haze';
	if (/partly|mostly sunny/.test(s)) return p.isDaytime ? 'partly-cloudy' : 'partly-cloudy-night';
	if (/cloud|overcast/.test(s)) return 'cloudy';
	if (/wind|breezy/.test(s)) return 'wind';
	return p.isDaytime ? 'clear' : 'clear-night';
}
function periodIcon(p: WeatherPeriod) {
	const c = condition(p);
	return c.includes('rain') || c.includes('drizzle') || c === 'thunderstorm'
		? CloudRain
		: c.includes('snow') || c === 'wintry-mix'
			? Snowflake
			: c.includes('night')
				? Moon
				: c === 'clear'
					? Sun
					: CloudSun;
}

export function WeatherForecast({
	timeZone,
	type = 'summary',
	size = 'default',
	density = 'comfortable',
	className,
	unit = 'fahrenheit',
	location = {
		label: 'Austin, TX',
		latitude: 30.2672,
		longitude: -97.7431,
		timeZone: 'America/Chicago'
	},
	forecast = sampleWeather,
	currentWeather = forecast === sampleWeather ? sampleCurrentWeather : null,
	showTemperatureTrend = false,
	showHighLow = false,
	at,
	sourceLabel = forecast === sampleWeather ? 'Sample forecast' : '',
	windUnit = 'mph',
	animatedBackground = false
}: WeatherForecastProps) {
	const [visitorTimeZone, setVisitorTimeZone] = useState('UTC');
	const [clock, setClock] = useState<number | null>(null);
	useEffect(() => {
		setVisitorTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
		setClock(Date.now());
		const timer = setInterval(() => setClock(Date.now()), 60000);
		return () => clearInterval(timer);
	}, []);
	const effectiveTime =
		at ?? (forecast === sampleWeather ? Date.parse(sampleCurrentWeather.observedAt) : (clock ?? 0));
	const outlook = weatherOutlook(
		currentWeather,
		forecast,
		unit,
		timeZone ?? visitorTimeZone,
		effectiveTime
	);
	const periods = forecast.slice(0, type === 'detailed' ? 8 : density === 'compact' ? 3 : 5);
	const current = currentWeather;
	const temperature = (p: WeatherPeriod) =>
		Math.round(
			unit === 'celsius' && p.temperatureUnit === 'F'
				? ((p.temperature - 32) * 5) / 9
				: unit === 'fahrenheit' && p.temperatureUnit === 'C'
					? (p.temperature * 9) / 5 + 32
					: p.temperature
		);
	if (
		forecast !== sampleWeather &&
		(forecast.length > 0 || currentWeather) &&
		at === undefined &&
		clock === null
	) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle>Weather</CardTitle>
					<CardDescription>{location.label}</CardDescription>
				</CardHeader>
				<CardContent>
					<p role="status">Loading current weather time…</p>
				</CardContent>
			</Card>
		);
	}
	return (
		<Card
			style={{ containerType: 'inline-size' }}
			data-density={density}
			data-card-size={size}
			className={cn(
				'relative isolate min-w-0 gap-0 overflow-hidden py-0',
				size === 'sm' ? '[--card-spacing:--spacing(4)]' : '[--card-spacing:--spacing(6)]',
				className
			)}
		>
			<div
				className={cn(
					'relative isolate overflow-hidden',
					animatedBackground && current ? 'text-white' : 'text-card-foreground'
				)}
			>
				{animatedBackground && current && (
					<>
						<div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
							<WeatherShaderBackground mode={condition(current)} />
						</div>
						<div
							className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-black/35 via-black/15 to-black/55"
							aria-hidden="true"
						/>
					</>
				)}
				<CardHeader className="relative px-(--card-spacing) pt-(--card-spacing)">
					<CardTitle>Weather</CardTitle>
					<CardDescription className={animatedBackground && current ? 'text-white/80' : ''}>
						{location.label ?? 'Local forecast'}
					</CardDescription>
				</CardHeader>
				<CardContent className="relative grid gap-5 px-(--card-spacing) py-(--card-spacing)">
					{current ? (
						<>
							<div>
								<p
									className={cn(
										'mb-2 text-xs',
										animatedBackground ? 'text-white/75' : 'text-muted-foreground'
									)}
								>
									Now
								</p>
								<p
									style={{ fontSize: 'clamp(2.5rem,18cqw,5rem)' }}
									className="leading-none font-medium tracking-tighter tabular-nums"
								>
									{temperature(current)}
									<span className="align-top text-2xl">°</span>
								</p>
								<p className="mt-3 text-sm">{current.shortForecast}</p>
								{showTemperatureTrend && outlook.trend && (
									<p className="mt-2 text-sm" data-slot="temperature-trend">
										{outlook.trend}
									</p>
								)}
								{showHighLow && (
									<div
										className="mt-3 flex gap-4 text-sm tabular-nums"
										data-slot="temperature-range"
									>
										{outlook.high !== null && (
											<span aria-label={`High ${outlook.high} degrees`}>
												<ArrowUp aria-hidden="true" className="inline size-3.5" /> {outlook.high}°
											</span>
										)}
										{outlook.low !== null && (
											<span aria-label={`Low ${outlook.low} degrees`}>
												<ArrowDown aria-hidden="true" className="inline size-3.5" /> {outlook.low}°
											</span>
										)}
									</div>
								)}
							</div>
							<div className="flex flex-wrap items-center justify-between gap-3 text-xs">
								<span className="flex items-center gap-2 opacity-80">
									<Wind aria-hidden="true" className="size-4" />
									Wind
								</span>
								<span className="tabular-nums">
									{current.windDirection} {convertWindSpeed(current.windSpeed, windUnit)}
								</span>
							</div>
						</>
					) : (
						<p role="status" className="py-8 text-center text-sm text-muted-foreground">
							Current conditions unavailable.
						</p>
					)}
					{type === 'simple' && sourceLabel && (
						<p
							className={cn(
								'text-[10px]',
								animatedBackground && current ? 'text-white/70' : 'text-muted-foreground'
							)}
						>
							{sourceLabel}
						</p>
					)}
				</CardContent>
			</div>
			{type !== 'simple' && (
				<CardContent className="px-(--card-spacing) pb-(--card-spacing)">
					{periods.length > 0 && (
						<div className="divide-y">
							{periods.map((period, index) => {
								const Icon = periodIcon(period);
								return (
									<div
										key={`${period.startTime}-${index}`}
										className={cn(
											'grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-sm',
											density === 'compact' ? 'py-2' : 'py-3'
										)}
									>
										<div>
											<p>{period.name}</p>
											{type === 'detailed' && (
												<p className="mt-1 text-xs leading-5 text-muted-foreground">
													{period.detailedForecast}
												</p>
											)}
										</div>
										<Icon aria-hidden="true" className="size-4 text-muted-foreground" />
										<span className="min-w-9 text-right tabular-nums">{temperature(period)}°</span>
									</div>
								);
							})}
						</div>
					)}
					{sourceLabel && <p className="mt-2 text-[10px] text-muted-foreground">{sourceLabel}</p>}
				</CardContent>
			)}
		</Card>
	);
}
