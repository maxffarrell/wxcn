'use client';

import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
import NumberFlow from '@number-flow/react';
import {
	Area,
	AreaChart,
	CartesianGrid,
	ReferenceDot,
	ReferenceLine,
	XAxis,
	YAxis
} from 'recharts';
import type { IconSet } from '../../icons/forecast-icons';
import { ForecastScreens, type ForecastAction, type OpenForecastDay } from './forecast-screens';
import { forecastDays, type ForecastDay } from '@wxcn/core/forecast-days.js';
import type {
	ForecastType,
	LocationInput,
	TidePoint,
	TidePrediction,
	TideReading,
	TideUnit
} from '@wxcn/core/types.js';
import { sampleTideSeries, sampleTideTime, sampleTides } from '@wxcn/core/tides.js';
import { tideState, tideTimestamp } from '@wxcn/core/tide-state.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export type TideForecastProps = {
	interactive?: boolean;
	iconType?: IconSet;
	timeZone?: string;
	type?: ForecastType;
	size?: 'sm' | 'default' | 'lg';
	density?: 'compact' | 'comfortable';
	className?: string;
	unit?: TideUnit;
	location?: LocationInput;
	predictions?: TidePrediction[];
	example?: boolean;
	series?: TidePoint[];
	reading?: TideReading | null;
	at?: number;
	sourceLabel?: string;
};

const defaultLocation: LocationInput = {
	label: 'Galveston Pier 21, TX',
	latitude: 29.31,
	longitude: -94.7933,
	station: '8771450',
	timeZone: 'America/Chicago'
};

const chartConfig = {
	height: { label: 'Tide level', color: 'var(--chart-1)' }
};
type ChartPoint = { time: number; height: number };

const formatTime = (value: string | number, timeZone: string) =>
	new Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		timeZone
	}).format(typeof value === 'string' ? tideTimestamp(value) : value);

const formatDateTime = (value: string, timeZone: string) =>
	new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		timeZone
	}).format(tideTimestamp(value));

function TideTooltipContent({
	onHover,
	displayTimeZone,
	unit,
	...props
}: ComponentProps<typeof ChartTooltipContent> & {
	onHover: (point: ChartPoint | null) => void;
	displayTimeZone: string;
	unit: TideUnit;
}) {
	const payloadPoint = props.payload?.[0]?.payload as Partial<ChartPoint> | undefined;
	useEffect(() => {
		onHover(
			payloadPoint?.time !== undefined && payloadPoint.height !== undefined
				? { time: payloadPoint.time, height: payloadPoint.height }
				: null
		);
	}, [onHover, payloadPoint?.height, payloadPoint?.time]);
	const symbol = unit === 'meter' ? 'm' : 'ft';
	const convertedHeight = (value: number) => (value * (unit === 'meter' ? 0.3048 : 1)).toFixed(1);
	return (
		<ChartTooltipContent
			{...props}
			labelFormatter={() =>
				payloadPoint?.time === undefined
					? 'Tide level'
					: formatTime(payloadPoint.time, displayTimeZone)
			}
			formatter={(value) => `${convertedHeight(Number(value))} ${symbol}`}
		/>
	);
}

export function TideForecast({
	interactive = false,
	iconType,
	timeZone,
	type = 'summary',
	size = 'default',
	density = 'comfortable',
	className = '',
	unit = 'ft',
	location = defaultLocation,
	predictions = sampleTides,
	example,
	series,
	reading = null,
	at,
	sourceLabel = 'Sample tides'
}: TideForecastProps) {
	const [visitorTimeZone, setVisitorTimeZone] = useState('UTC');
	const [clock, setClock] = useState<number | null>(null);
	const [hovered, setHovered] = useState<ChartPoint | null>(null);
	const [dayHovered, setDayHovered] = useState<ChartPoint | null>(null);
	useEffect(() => {
		setVisitorTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
		setClock(Date.now());
		const timer = window.setInterval(() => setClock(Date.now()), 60_000);
		return () => window.clearInterval(timer);
	}, []);

	const displayTimeZone = timeZone ?? location.timeZone ?? visitorTimeZone;
	const isSample = example ?? predictions === sampleTides;
	const now = at ?? (isSample ? sampleTideTime : (clock ?? 0));
	const tide = useMemo(
		() => tideState(predictions, series ?? (isSample ? sampleTideSeries : []), reading, now),
		[predictions, series, isSample, reading, now]
	);
	const chartData = useMemo<ChartPoint[]>(() => {
		const curveData = tide.points.filter(
			(point: ChartPoint) =>
				point.time >= now - 12 * 60 * 60 * 1000 && point.time <= now + 18 * 60 * 60 * 1000
		);
		if (tide.predicted !== null && !curveData.some((point: ChartPoint) => point.time === now)) {
			return [...curveData, { time: now, height: tide.predicted }].sort(
				(a: ChartPoint, b: ChartPoint) => a.time - b.time
			);
		}
		return curveData;
	}, [now, tide.points, tide.predicted]);
	const domain = useMemo(() => {
		const values = chartData.map((point: ChartPoint) => point.height);
		if (tide.level !== null) values.push(tide.level);
		if (!values.length) return [0, 1] as [number, number];
		const low = Math.min(...values);
		const high = Math.max(...values);
		const padding = Math.max(0.15, (high - low) * 0.2);
		return [low - padding, high + padding] as [number, number];
	}, [chartData, tide.level]);
	const height = (value: number) => (value * (unit === 'meter' ? 0.3048 : 1)).toFixed(1);
	const symbol = unit === 'meter' ? 'm' : 'ft';
	const chartHeight = size === 'sm' ? 64 : size === 'lg' ? 144 : 112;
	const handleHover = useCallback((point: ChartPoint | null) => setHovered(point), []);
	const handleDayHover = useCallback((point: ChartPoint | null) => setDayHovered(point), []);
	const days = useMemo(
		() =>
			forecastDays(
				tide.events
					.filter((event) => {
						const eventTime = tideTimestamp(event.time);
						return eventTime >= now && eventTime < now + 7 * 86400000;
					})
					.map((event) => ({
						time: tideTimestamp(event.time),
						label: formatTime(event.time, displayTimeZone),
						summary: `${event.type === 'H' ? 'High' : 'Low'} tide · ${height(Number(event.height))} ${symbol}`,
						details: `Predicted ${event.type === 'H' ? 'high' : 'low'} tide, ${height(Number(event.height))} ${symbol} above MLLW.`
					})),
				displayTimeZone
			),
		[now, tide.events, displayTimeZone, symbol, unit]
	);
	if (
		!isSample &&
		(predictions.length > 0 || (series?.length ?? 0) > 0) &&
		at === undefined &&
		clock === null
	) {
		return (
			<Card
				style={{ containerType: 'inline-size' }}
				data-density={density}
				data-card-size={size}
				data-size={size === 'sm' ? 'sm' : 'default'}
				className={`relative isolate min-w-0 overflow-hidden ${className}`}
			>
				<CardHeader>
					<CardTitle>Tides</CardTitle>
					<CardDescription>{location.label}</CardDescription>
				</CardHeader>
				<CardContent>
					<p role="status" className="py-8 text-center text-sm text-muted-foreground">
						Loading current tide time…
					</p>
				</CardContent>
			</Card>
		);
	}
	function pointsForDay(day: ForecastDay) {
		const key = new Intl.DateTimeFormat('en-CA', {
			timeZone: displayTimeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
		return tide.points.filter((point) => key.format(point.time) === day.key);
	}
	function dailyDomain(points: ChartPoint[]): [number, number] {
		const values = points.map((point) => point.height);
		if (!values.length) return [0, 1];
		const low = Math.min(...values);
		const high = Math.max(...values);
		const padding = Math.max(0.15, (high - low) * 0.2);
		return [low - padding, high + padding];
	}
	function cardView(
		day: ForecastDay | undefined,
		action: ForecastAction,
		openDay: OpenForecastDay
	) {
		const events = day
			? tide.events.filter((event) =>
					day.entries.some((entry) => entry.time === tideTimestamp(event.time))
				)
			: predictions;
		const viewNow = day ? day.entries[0].time : now;
		const viewTide = day
			? tideState(events, series ?? (isSample ? sampleTideSeries : []), null, viewNow)
			: tide;
		const viewChartData = day ? pointsForDay(day) : chartData;
		const viewDomain = day ? dailyDomain(viewChartData) : domain;
		const viewHovered = day
			? dayHovered && viewChartData.some((point) => point.time === dayHovered.time)
				? dayHovered
				: null
			: hovered;
		const updateHover = day ? handleDayHover : handleHover;
		const viewDisplayedLevel = viewHovered?.height ?? viewTide.level;
		const viewDisplayedTime =
			viewHovered?.time ??
			(day ? viewNow : viewTide.observed ? tideTimestamp(viewTide.observed.time) : now);
		const viewIndicatorTime = viewHovered?.time ?? (day ? viewDisplayedTime : now);
		const viewIndicatorLevel = viewHovered?.height ?? viewTide.predicted;
		const viewTimeParts = new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			timeZone: displayTimeZone
		}).formatToParts(viewDisplayedTime);
		const neighbors = (
			<div
				data-slot="tide-neighbors"
				className={
					size === 'sm' ? 'grid content-center gap-3' : 'grid grid-cols-2 gap-3 border-t pt-3'
				}
			>
				{[
					{ label: 'Previous', event: viewTide.previous },
					{ label: 'Next', event: viewTide.next }
				].map(({ label, event }) => (
					<div key={label}>
						<p
							className={
								size === 'sm'
									? 'text-[10px] text-muted-foreground'
									: 'text-xs text-muted-foreground'
							}
						>
							{label} {event ? (event.type === 'H' ? 'high tide' : 'low tide') : 'tide'}
						</p>
						<div
							className={
								size === 'sm' ? 'mt-0.5 flex flex-wrap items-baseline gap-x-2' : 'contents'
							}
						>
							<p
								className={
									size === 'sm'
										? 'text-xs font-medium tabular-nums'
										: 'mt-1 text-sm font-medium tabular-nums'
								}
							>
								{event ? formatTime(event.time, displayTimeZone) : 'Unavailable'}
							</p>
							{event ? (
								<p
									className={
										size === 'sm'
											? 'text-[10px] text-muted-foreground'
											: 'mt-1 text-xs text-muted-foreground'
									}
								>
									{height(Number(event.height))} {symbol}
								</p>
							) : null}
						</div>
					</div>
				))}
			</div>
		);
		return (
			<>
				<CardHeader
					className={size === 'sm' ? 'flex items-baseline justify-between gap-2' : undefined}
				>
					<CardTitle>{day?.label ?? 'Tides'}</CardTitle>
					<CardDescription>{location.label}</CardDescription>
					{action(false)}
				</CardHeader>
				<CardContent
					className={`${size === 'sm' || density === 'compact' ? 'grid gap-3' : 'grid gap-5'}`}
				>
					{viewTide.events.length || viewTide.points.length ? (
						<>
							<div className={`flex items-end justify-between gap-3 ${day ? '' : 'flex-wrap'}`}>
								<div className="min-w-0">
									<p className={`mb-1 text-xs text-muted-foreground ${day ? 'truncate' : ''}`}>
										{viewHovered
											? 'Predicted water level'
											: !day && isSample
												? 'Example water level'
												: viewTide.observed
													? 'Current water level'
													: viewTide.predicted !== null
														? 'Predicted water level'
														: 'High/low predictions only'}
									</p>
									<p
										style={
											size === 'sm'
												? { fontSize: 'clamp(1.25rem, 8cqw, 1.875rem)', lineHeight: 1.1 }
												: { fontSize: 'clamp(1.5rem, 12cqw, 2.5rem)' }
										}
										className={`${size === 'sm' ? 'text-3xl' : 'text-4xl'} font-medium tracking-tight tabular-nums`}
									>
										{viewDisplayedLevel === null ? (
											'—'
										) : (
											<NumberFlow
												value={Number(height(viewDisplayedLevel))}
												format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
											/>
										)}
										<span className="ml-1 text-sm text-muted-foreground">{symbol}</span>
									</p>
								</div>
								<div className="text-right text-xs text-muted-foreground">
									<p>
										{viewHovered
											? 'Selected time'
											: viewTide.next
												? viewTide.next.type === 'H'
													? 'Rising toward high tide'
													: 'Falling toward low tide'
												: 'Tide outlook'}
									</p>
									<p className="mt-1 tabular-nums" data-slot="tide-time">
										<span className="sr-only">
											{formatTime(viewDisplayedTime, displayTimeZone)}
										</span>
										<span aria-hidden="true">
											{viewTimeParts.map((part, index) =>
												part.type === 'hour' || part.type === 'minute' ? (
													<NumberFlow
														key={`${part.type}-${index}`}
														value={Number(part.value)}
														format={{
															minimumIntegerDigits: part.type === 'minute' ? 2 : 1,
															useGrouping: false
														}}
													/>
												) : (
													part.value
												)
											)}
										</span>
									</p>
								</div>
							</div>
							<div
								data-slot="tide-chart-layout"
								className={
									size === 'sm'
										? 'grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3'
										: 'contents'
								}
							>
								{size === 'sm' ? neighbors : null}
								<div className={size === 'sm' ? 'grid min-w-0 gap-1' : 'contents'}>
									{viewChartData.length > 1 ? (
										<>
											<ChartContainer
												config={chartConfig}
												className={`aspect-auto w-full ${size === 'sm' ? 'h-16' : size === 'lg' ? 'h-36' : 'h-28'}`}
												role="img"
												aria-label="Tide prediction curve with predicted water level marker"
											>
												<AreaChart
													data={viewChartData}
													height={chartHeight}
													margin={{ top: 8, right: 8, bottom: 4, left: 8 }}
													onMouseMove={(state) => {
														const index = Number(state.activeTooltipIndex);
														const point = Number.isInteger(index)
															? viewChartData[index]
															: undefined;
														updateHover(point ?? null);
													}}
													onMouseLeave={() => updateHover(null)}
												>
													<CartesianGrid
														vertical={false}
														stroke="var(--border)"
														strokeDasharray="3 4"
													/>
													<XAxis
														dataKey="time"
														type="number"
														domain={[
															viewChartData[0].time,
															viewChartData[viewChartData.length - 1].time
														]}
														hide
													/>
													<YAxis hide domain={viewDomain} />
													<ChartTooltip
														content={
															<TideTooltipContent
																indicator="line"
																onHover={updateHover}
																displayTimeZone={displayTimeZone}
																unit={unit}
															/>
														}
													/>
													<Area
														type="monotone"
														dataKey="height"
														name="Tide level"
														stroke="var(--chart-1)"
														fill="var(--chart-1)"
														fillOpacity={0.12}
														strokeWidth={2}
														isAnimationActive={false}
													/>
													{viewIndicatorLevel !== null &&
													viewIndicatorTime >= viewChartData[0].time &&
													viewIndicatorTime <= viewChartData[viewChartData.length - 1].time ? (
														<>
															<ReferenceLine
																x={viewIndicatorTime}
																stroke="var(--muted-foreground)"
																strokeDasharray="3 4"
															/>
															<ReferenceDot
																x={viewIndicatorTime}
																y={viewIndicatorLevel}
																r={4.5}
																fill="var(--chart-1)"
																stroke="var(--card)"
																strokeWidth={2}
																data-slot="current-tide-marker"
															/>
														</>
													) : null}
												</AreaChart>
											</ChartContainer>
											<div
												className={`flex justify-between gap-1 text-[10px] text-muted-foreground ${size === 'sm' ? '' : '-mt-2'}`}
											>
												<span>{formatTime(viewChartData[0].time, displayTimeZone)}</span>
												{size !== 'sm' ? (
													<span>
														MLLW · {viewTide.points.length ? 'predicted curve' : 'extrema only'}
													</span>
												) : null}
												<span>{formatTime(viewChartData.at(-1)!.time, displayTimeZone)}</span>
											</div>
										</>
									) : null}
								</div>
							</div>
							{size !== 'sm' ? neighbors : null}
							{type !== 'simple' ? (
								<div className="divide-y border-t">
									{(viewTide.events as TidePrediction[])
										.filter((event: TidePrediction) => tideTimestamp(event.time) > viewNow)
										.slice(0, type === 'detailed' ? 6 : density === 'compact' ? 2 : 4)
										.map((event: TidePrediction) => (
											<div
												key={`${event.time}-${event.type}`}
												className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 text-xs ${density === 'compact' ? 'py-2' : 'py-3'}`}
											>
												<span>{event.type === 'H' ? 'High tide' : 'Low tide'}</span>
												<span className="ml-auto text-muted-foreground">
													{formatDateTime(event.time, displayTimeZone)}
												</span>
												<span className="tabular-nums">
													{height(Number(event.height))} {symbol}
												</span>
											</div>
										))}
								</div>
							) : null}
						</>
					) : (
						<p role="status" className="py-8 text-center text-sm text-muted-foreground">
							No tide predictions available.
						</p>
					)}
					{!day && sourceLabel ? (
						<p className="text-[10px] text-muted-foreground">{sourceLabel}</p>
					) : null}
				</CardContent>
			</>
		);
	}
	const upcomingSummary = (availableHeight: number) => {
		const events = tide.events
			.filter((event) => tideTimestamp(event.time) >= now)
			.slice(0, size === 'lg' ? 12 : Math.max(1, Math.floor(availableHeight / 36)));
		return (
			<div
				className="grid h-full w-full overflow-y-auto"
				style={{ gridAutoRows: `minmax(${size === 'lg' ? 40 : 36}px, 1fr)` }}
				data-slot="upcoming-tides"
			>
				{events.length ? (
					events.map((event) => (
						<div
							className={`grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3 border-b last:border-0 ${size === 'lg' ? 'text-sm' : 'text-xs'}`}
							key={`${event.time}-${event.type}`}
						>
							<span className="font-medium">{event.type === 'H' ? 'High tide' : 'Low tide'}</span>
							<time
								dateTime={new Date(tideTimestamp(event.time)).toISOString()}
								className="text-right text-muted-foreground"
							>
								{formatDateTime(event.time, displayTimeZone)}
							</time>
							<span className="text-right tabular-nums">
								{height(Number(event.height))} {symbol}
							</span>
						</div>
					))
				) : (
					<p className="py-4 text-sm text-muted-foreground">
						No upcoming tide predictions available.
					</p>
				)}
			</div>
		);
	};

	return (
		<Card
			style={{ containerType: 'inline-size' }}
			data-density={density}
			data-card-size={size}
			data-size={size === 'sm' ? 'sm' : 'default'}
			className={`relative isolate min-w-0 overflow-hidden ${className}`}
		>
			<ForecastScreens
				interactive={interactive}
				days={days}
				title="Tide"
				density={density}
				sourceLabel={sourceLabel}
				iconType={iconType}
				showWeek
				actionLabel="Upcoming tides"
				summary={upcomingSummary}
				children={(openDay, action) => cardView(undefined, action, openDay)}
				detail={(day, action) => cardView(day, action, () => {})}
			/>
		</Card>
	);
}

export default TideForecast;
