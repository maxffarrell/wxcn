'use client';

import * as React from 'react';
import type { IconSet } from '../../icons/forecast-icons';

import { forecastDays, type ForecastDay } from '@wxcn/core/forecast-days.js';
import type { ForecastType, LocationInput, MoonForecast as MoonData } from '@wxcn/core/types.js';
import { getMoonForecast, sampleMoon } from '@wxcn/core/moon.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ForecastScreens } from './forecast-screens';
import MoonDisc from './moon-disc';

export type MoonForecastProps = {
	iconType?: IconSet;
	interactive?: boolean;
	timeZone?: string;
	type?: ForecastType;
	size?: 'sm' | 'default' | 'lg';
	density?: 'compact' | 'comfortable';
	className?: string;
	location?: LocationInput;
	forecast?: MoonData;
	sourceLabel?: string;
};

const defaultLocation: LocationInput = {
	label: 'Austin, TX',
	latitude: 30.2672,
	longitude: -97.7431
};

function MoonCardView({
	day,
	action,
	forecast,
	date,
	type,
	size,
	density,
	sourceLabel,
	location
}: {
	day?: ForecastDay;
	action?: React.ReactNode;
	forecast: MoonData;
	date: (value: string) => string;
	type: ForecastType;
	size: 'sm' | 'default' | 'lg';
	density: 'compact' | 'comfortable';
	sourceLabel: string;
	location: LocationInput;
}) {
	const view =
		day && day.entries[0].time !== Date.parse(forecast.date)
			? getMoonForecast(new Date(day.entries[0].time))
			: forecast;
	return (
		<>
			<CardHeader>
				<CardTitle>{day?.label ?? 'Moon phase'}</CardTitle>
				<CardDescription>{location.label}</CardDescription>
				{action}
			</CardHeader>
			<CardContent
				className={cn(
					'grid px-[var(--card-spacing,var(--wxcn-spacing))]',
					density === 'compact' ? 'gap-3' : 'gap-5'
				)}
			>
				<div
					className={cn(
						'flex items-center gap-4',
						size === 'lg' && 'flex-col rounded-lg bg-muted/20 p-5 text-center'
					)}
				>
					<MoonDisc
						phase={view.phase ?? view.age / 29.530588853}
						label={`${view.phaseName}, ${view.illumination}% illuminated`}
						className={
							size === 'sm'
								? 'size-16 shrink-0'
								: size === 'lg'
									? 'size-36 shrink-0'
									: 'size-24 max-w-[28cqw] shrink-0'
						}
					/>
					<div>
						<p
							style={{ fontSize: 'clamp(1rem,6cqw,1.5rem)' }}
							className={cn('font-medium tracking-tight', size === 'sm' ? 'text-lg' : 'text-2xl')}
						>
							{view.phaseName}
						</p>
						<p className="mt-2 text-sm text-muted-foreground">{view.illumination}% illuminated</p>
					</div>
				</div>
				{type !== 'simple' && (
					<dl className="moon-data divide-y text-sm">
						<div
							className={cn(
								'flex justify-between gap-4 pb-3',
								density === 'compact' && 'py-[0.4rem]'
							)}
						>
							<dt className="text-muted-foreground">Moon age</dt>
							<dd>{view.age} days</dd>
						</div>
						<div
							className={cn(
								'flex justify-between gap-4 py-3',
								density === 'compact' && 'py-[0.4rem]'
							)}
						>
							<dt className="text-muted-foreground">Next full moon</dt>
							<dd>{date(view.nextFullMoon)}</dd>
						</div>
						<div
							className={cn(
								'flex justify-between gap-4 pt-3',
								density === 'compact' && 'py-[0.4rem]'
							)}
						>
							<dt className="text-muted-foreground">Next new moon</dt>
							<dd>{date(view.nextNewMoon)}</dd>
						</div>
					</dl>
				)}
				{!day && sourceLabel && (
					<p className="text-[10px] text-muted-foreground">
						{sourceLabel} · {date(view.date)}
					</p>
				)}
			</CardContent>
		</>
	);
}

export function MoonForecast({
	iconType,
	interactive = false,
	timeZone,
	type = 'summary',
	size = 'default',
	density = 'comfortable',
	className,
	location = defaultLocation,
	forecast = sampleMoon,
	sourceLabel = ''
}: MoonForecastProps) {
	const [visitorTimeZone, setVisitorTimeZone] = React.useState('UTC');
	React.useEffect(() => setVisitorTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone), []);
	const displayTimeZone = timeZone ?? location.timeZone ?? visitorTimeZone;
	const date = React.useCallback(
		(value: string) =>
			new Intl.DateTimeFormat('en-US', {
				month: 'short',
				day: 'numeric',
				timeZone: displayTimeZone
			}).format(new Date(value)),
		[displayTimeZone]
	);
	const days = React.useMemo(
		() =>
			forecastDays(
				Array.from({ length: 7 }, (_, index) => {
					const value =
						index === 0
							? forecast
							: getMoonForecast(new Date(Date.parse(forecast.date) + index * 86400000));
					return {
						time: Date.parse(value.date),
						label: value.phaseName,
						summary: `${value.illumination}% illuminated`,
						details: `Moon age: ${value.age} days. Next full moon: ${date(value.nextFullMoon)}. Next new moon: ${date(value.nextNewMoon)}.`
					};
				}),
				displayTimeZone
			),
		[date, displayTimeZone, forecast]
	);

	return (
		<Card
			style={
				{
					containerType: 'inline-size',
					['--wxcn-spacing' as string]: size === 'sm' ? '1rem' : '1.5rem'
				} as React.CSSProperties
			}
			data-density={density}
			data-card-size={size}
			data-size={size === 'sm' ? 'sm' : 'default'}
			className={cn('relative isolate min-w-0 overflow-hidden', className)}
		>
			<ForecastScreens
				interactive={interactive}
				iconType={iconType}
				days={days}
				title="Moon"
				density={density}
				sourceLabel={sourceLabel}
				detail={(day, action) => (
					<MoonCardView
						day={day}
						forecast={forecast}
						date={date}
						type={type}
						size={size}
						density={density}
						sourceLabel={sourceLabel}
						location={location}
						action={action(false)}
					/>
				)}
			>
				{(_openDay, action) => (
					<MoonCardView
						forecast={forecast}
						date={date}
						type={type}
						size={size}
						density={density}
						sourceLabel={sourceLabel}
						location={location}
						action={action(false)}
					/>
				)}
			</ForecastScreens>
		</Card>
	);
}

export default MoonForecast;
