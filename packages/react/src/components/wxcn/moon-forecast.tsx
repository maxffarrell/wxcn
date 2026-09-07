'use client';

import * as React from 'react';

import type { ForecastType, LocationInput, MoonForecast as MoonData } from '@wxcn/core/types.js';
import { sampleMoon } from '@wxcn/core/moon.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import MoonDisc from './moon-disc';

export type MoonForecastProps = {
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

export function MoonForecast({
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
	const displayTimeZone = timeZone ?? visitorTimeZone;
	const date = React.useCallback(
		(value: string) =>
			new Intl.DateTimeFormat('en-US', {
				month: 'short',
				day: 'numeric',
				timeZone: displayTimeZone
			}).format(new Date(value)),
		[displayTimeZone]
	);
	const phase = forecast.age / 29.530588853;

	return (
		<Card
			style={{ containerType: 'inline-size' }}
			data-density={density}
			data-card-size={size}
			className={cn('min-w-0 overflow-hidden', className)}
		>
			<CardHeader>
				<CardTitle>Moon phase</CardTitle>
				<CardDescription>{location.label}</CardDescription>
			</CardHeader>
			<CardContent className={cn('grid', density === 'compact' ? 'gap-3' : 'gap-5')}>
				<div
					className={cn(
						'flex items-center gap-4',
						size === 'lg' && 'flex-col rounded-lg bg-muted/20 p-5 text-center'
					)}
				>
					<MoonDisc
						phase={phase}
						label={`${forecast.phaseName}, ${forecast.illumination}% illuminated`}
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
							{forecast.phaseName}
						</p>
						<p className="mt-2 text-sm text-muted-foreground">
							{forecast.illumination}% illuminated
						</p>
					</div>
				</div>
				{type !== 'simple' && (
					<dl className="moon-data divide-y text-sm">
						<div className="flex justify-between gap-4 pb-3">
							<dt className="text-muted-foreground">Moon age</dt>
							<dd>{forecast.age} days</dd>
						</div>
						<div className="flex justify-between gap-4 py-3">
							<dt className="text-muted-foreground">Next full moon</dt>
							<dd>{date(forecast.nextFullMoon)}</dd>
						</div>
						<div className="flex justify-between gap-4 pt-3">
							<dt className="text-muted-foreground">Next new moon</dt>
							<dd>{date(forecast.nextNewMoon)}</dd>
						</div>
					</dl>
				)}
				{sourceLabel && (
					<p className="text-[10px] text-muted-foreground">
						{sourceLabel} · {date(forecast.date)}
					</p>
				)}
			</CardContent>
		</Card>
	);
}

export default MoonForecast;
