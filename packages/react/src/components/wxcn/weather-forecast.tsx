'use client';

import { useEffect, useState } from 'react';
import { ForecastScreens, type ForecastAction, type OpenForecastDay } from './forecast-screens';
import { forecastDays, type ForecastDay } from '@wxcn/core/forecast-days.js';
import { ForecastIcon, type IconSet, type IconName } from '../../icons/forecast-icons';
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
	interactive?: boolean;
	iconType?: IconSet;
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
function periodIcon(p: WeatherPeriod): IconName {
	const c = condition(p);
	return c.includes('rain') || c.includes('drizzle') || c === 'thunderstorm'
		? 'rain'
		: c.includes('snow') || c === 'wintry-mix'
			? 'snow'
			: c.includes('night')
				? 'moon'
				: c === 'clear'
					? 'sun'
					: 'weather';
}

export function WeatherForecast({
	interactive = false,
	iconType,
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
		timeZone ?? location.timeZone ?? visitorTimeZone,
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
	const days = forecastDays(
		forecast.map((p) => ({
			time: Date.parse(p.startTime),
			label: p.name,
			summary: `${temperature(p)}° · ${p.shortForecast}`,
			details: `${p.detailedForecast || p.shortForecast} Wind: ${p.windDirection} ${convertWindSpeed(p.windSpeed, windUnit)}.`
		})),
		timeZone ?? location.timeZone ?? visitorTimeZone
	);
	function cardView(
		day: ForecastDay | undefined,
		action: ForecastAction,
		overviewVisible: boolean,
		openDay: OpenForecastDay
	) {
		const displayedPeriods = day
			? forecast
					.filter((period) =>
						day.entries.some((entry) => entry.time === Date.parse(period.startTime))
					)
					.toSorted((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
			: periods;
		const view = day
			? (displayedPeriods.find((period) => period.isDaytime) ?? displayedPeriods[0])
			: current;
		return (
			<>
				<div
					className={cn(
						'relative isolate overflow-hidden',
						animatedBackground && view ? 'text-white' : 'text-card-foreground'
					)}
				>
					{animatedBackground && view && (
						<>
							<div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
								<WeatherShaderBackground mode={condition(view)} paused={!overviewVisible} />
							</div>
							<div
								className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-black/35 via-black/15 to-black/55"
								aria-hidden="true"
							/>
						</>
					)}
					<CardHeader className="relative px-[var(--card-spacing,var(--wxcn-spacing))] pt-[var(--card-spacing,var(--wxcn-spacing))]">
						<CardTitle>{day?.label ?? 'Weather'}</CardTitle>
						<CardDescription className={animatedBackground && view ? 'text-white/80' : ''}>
							{location.label ?? 'Local forecast'}
						</CardDescription>
						{action(animatedBackground && !!view)}
					</CardHeader>
					<CardContent className="relative grid gap-5 px-[var(--card-spacing,var(--wxcn-spacing))] py-[var(--card-spacing,var(--wxcn-spacing))]">
						{view ? (
							<>
								<div>
									<p
										className={cn(
											'mb-2 text-xs',
											animatedBackground ? 'text-white/75' : 'text-muted-foreground'
										)}
									>
										{day ? (view.isDaytime ? 'Daytime' : 'Overnight') : 'Now'}
									</p>
									<p
										style={{ fontSize: 'clamp(2.5rem,18cqw,5rem)' }}
										className="leading-none font-medium tracking-tighter tabular-nums"
									>
										{temperature(view)}
										<span className="align-top text-2xl">°</span>
									</p>
									<p
										className={`mt-3 text-sm ${day ? 'truncate' : ''}`}
										title={day ? view.shortForecast : undefined}
									>
										{view.shortForecast}
									</p>
									{!day && showTemperatureTrend && outlook.trend && (
										<p className="mt-2 text-sm" data-slot="temperature-trend">
											{outlook.trend}
										</p>
									)}
									{!day && showHighLow && (
										<div
											className="mt-3 flex gap-4 text-sm tabular-nums"
											data-slot="temperature-range"
										>
											{outlook.high !== null && (
												<span aria-label={`High ${outlook.high} degrees`}>
													<ForecastIcon
														name="arrowUp"
														iconSet={iconType}
														className="inline size-3.5"
													/>{' '}
													{outlook.high}°
												</span>
											)}
											{outlook.low !== null && (
												<span aria-label={`Low ${outlook.low} degrees`}>
													<ForecastIcon
														name="arrowDown"
														iconSet={iconType}
														className="inline size-3.5"
													/>{' '}
													{outlook.low}°
												</span>
											)}
										</div>
									)}
								</div>
								<div className="flex flex-wrap items-center justify-between gap-3 text-xs">
									<span className="flex items-center gap-2 opacity-80">
										<ForecastIcon name="wind" iconSet={iconType} className="size-4" />
										Wind
									</span>
									<span className="tabular-nums">
										{view.windDirection} {convertWindSpeed(view.windSpeed, windUnit)}
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
									animatedBackground && view ? 'text-white/70' : 'text-muted-foreground'
								)}
							>
								{sourceLabel}
							</p>
						)}
					</CardContent>
				</div>
				{type !== 'simple' && (
					<CardContent className="px-[var(--card-spacing,var(--wxcn-spacing))] pb-[var(--card-spacing,var(--wxcn-spacing))]">
						{displayedPeriods.length > 0 && (
							<div className="divide-y">
								{displayedPeriods.map((period, index) => {
									const icon = periodIcon(period);
									return (
										<div
											key={`${period.startTime}-${index}`}
											className={cn(
												'grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-sm',
												density === 'compact' ? 'py-2' : 'py-3'
											)}
										>
											<div>
												{interactive && !day ? (
													<button
														type="button"
														className="min-h-8 text-left underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
														aria-label={`View details for ${period.name}`}
														onClick={(event) => openDay(period.startTime, event.currentTarget)}
													>
														{period.name}
													</button>
												) : (
													<p>{period.name}</p>
												)}
												{(type === 'detailed' || (day && size !== 'sm')) && (
													<p className="mt-1 text-xs leading-5 text-muted-foreground">
														{type === 'detailed' ? period.detailedForecast : period.shortForecast}
													</p>
												)}
											</div>
											<ForecastIcon
												name={icon}
												iconSet={iconType}
												className="size-4 text-muted-foreground"
											/>
											<span className="min-w-9 text-right tabular-nums">
												{temperature(period)}°
											</span>
										</div>
									);
								})}
							</div>
						)}
						{sourceLabel && <p className="mt-2 text-[10px] text-muted-foreground">{sourceLabel}</p>}
					</CardContent>
				)}
			</>
		);
	}

	return (
		<Card
			data-density={density}
			style={
				{
					containerType: 'inline-size',
					'--wxcn-spacing': size === 'sm' ? '1rem' : '1.5rem'
				} as import('react').CSSProperties
			}
			data-card-size={size}
			data-size={size === 'sm' ? 'sm' : 'default'}
			className={cn(
				'relative isolate min-w-0 gap-0 overflow-hidden py-0',

				className
			)}
		>
			<ForecastScreens
				interactive={interactive}
				days={days}
				title="Weather"
				density={density}
				sourceLabel={sourceLabel}
				iconType={iconType}
				showWeek={size === 'sm' || type === 'simple'}
				flush
				detail={(day, action) => cardView(day, action, true, () => {})}
			>
				{(openDay, action, visible) => cardView(undefined, action, visible, openDay)}
			</ForecastScreens>
		</Card>
	);
}
