'use client';

import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
import {
	Area,
	AreaChart,
	CartesianGrid,
	ReferenceDot,
	ReferenceLine,
	XAxis,
	YAxis
} from 'recharts';
import { ArrowDown, ArrowUp } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export type TideForecastProps = {
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
	const [hovered, setHovered] = useState<{ time: number; height: number } | null>(null);
	useEffect(() => {
		setVisitorTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
		setClock(Date.now());
		const timer = window.setInterval(() => setClock(Date.now()), 60_000);
		return () => window.clearInterval(timer);
	}, []);

	const displayTimeZone = timeZone ?? visitorTimeZone;
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
	const displayedLevel = hovered?.height ?? tide.level;
	const displayedTime = hovered?.time ?? (tide.observed ? tideTimestamp(tide.observed.time) : now);
	const indicatorTime = hovered?.time ?? now;
	const indicatorLevel = hovered?.height ?? tide.predicted;
	const chartHeight = size === 'sm' ? 80 : size === 'lg' ? 144 : 112;
	const handleHover = useCallback((point: ChartPoint | null) => setHovered(point), []);
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
				className={`min-w-0 overflow-hidden ${className}`}
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

	return (
		<Card
			style={{ containerType: 'inline-size' }}
			data-density={density}
			data-card-size={size}
			className={`min-w-0 overflow-hidden ${className}`}
		>
			<CardHeader>
				<CardTitle>Tides</CardTitle>
				<CardDescription>{location.label}</CardDescription>
			</CardHeader>
			<CardContent className={density === 'compact' ? 'grid gap-3' : 'grid gap-5'}>
				{tide.events.length || tide.points.length ? (
					<>
						<div className="flex flex-wrap items-end justify-between gap-3">
							<div>
								<p className="mb-1 text-xs text-muted-foreground">
									{hovered
										? 'Predicted water level'
										: isSample
											? 'Example water level'
											: tide.observed
												? 'Current water level'
												: tide.predicted !== null
													? 'Predicted water level'
													: 'High/low predictions only'}
								</p>
								<p
									style={{ fontSize: 'clamp(1.5rem, 12cqw, 2.5rem)' }}
									className={`${size === 'sm' ? 'text-3xl' : 'text-4xl'} font-medium tracking-tight tabular-nums`}
								>
									{displayedLevel === null ? '—' : height(displayedLevel)}
									<span className="ml-1 text-sm text-muted-foreground">{symbol}</span>
								</p>
							</div>
							<div className="text-right text-xs text-muted-foreground">
								<p>
									{hovered
										? 'Selected time'
										: tide.next
											? tide.next.type === 'H'
												? 'Rising toward high tide'
												: 'Falling toward low tide'
											: 'Tide outlook'}
								</p>
								<p className="mt-1 tabular-nums" data-slot="tide-time">
									<span className="sr-only">{formatTime(displayedTime, displayTimeZone)}</span>
									<span aria-hidden="true">{formatTime(displayedTime, displayTimeZone)}</span>
								</p>
							</div>
						</div>
						{chartData.length > 1 ? (
							<>
								<ChartContainer
									config={chartConfig}
									className={`aspect-auto w-full ${size === 'sm' ? 'h-20' : size === 'lg' ? 'h-36' : 'h-28'}`}
									role="img"
									aria-label="Tide prediction curve with predicted water level marker"
								>
									<AreaChart
										data={chartData}
										height={chartHeight}
										margin={{ top: 8, right: 8, bottom: 4, left: 8 }}
										onMouseMove={(state) => {
											const index = Number(state.activeTooltipIndex);
											const point = Number.isInteger(index) ? chartData[index] : undefined;
											setHovered(point ?? null);
										}}
										onMouseLeave={() => setHovered(null)}
									>
										<CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
										<XAxis
											dataKey="time"
											type="number"
											domain={[chartData[0].time, chartData[chartData.length - 1].time]}
											hide
										/>
										<YAxis hide domain={domain} />
										<ChartTooltip
											content={
												<TideTooltipContent
													indicator="line"
													onHover={handleHover}
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
										{indicatorLevel !== null &&
										indicatorTime >= chartData[0].time &&
										indicatorTime <= chartData[chartData.length - 1].time ? (
											<>
												<ReferenceLine
													x={indicatorTime}
													stroke="var(--muted-foreground)"
													strokeDasharray="3 4"
												/>
												<ReferenceDot
													x={indicatorTime}
													y={indicatorLevel}
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
								<div className="-mt-2 flex justify-between text-[10px] text-muted-foreground">
									<span>{formatTime(chartData[0].time, displayTimeZone)}</span>
									<span>
										<Badge variant="outline" className="h-4 px-1 text-[9px]">
											MLLW
										</Badge>{' '}
										· {tide.points.length ? 'predicted curve' : 'extrema only'}
									</span>
									<span>{formatTime(chartData.at(-1)!.time, displayTimeZone)}</span>
								</div>
							</>
						) : null}
						<div className="grid grid-cols-2 gap-3 border-t pt-3">
							{[
								{ label: 'Previous', event: tide.previous },
								{ label: 'Next', event: tide.next }
							].map(({ label, event }) => (
								<div key={label}>
									<p className="text-xs text-muted-foreground">
										{label} {event ? (event.type === 'H' ? 'high tide' : 'low tide') : 'tide'}
									</p>
									<p className="mt-1 text-sm font-medium tabular-nums">
										{event ? formatTime(event.time, displayTimeZone) : 'Unavailable'}
									</p>
									{event ? (
										<p className="mt-1 text-xs text-muted-foreground">
											{height(Number(event.height))} {symbol}
										</p>
									) : null}
								</div>
							))}
						</div>
						{type !== 'simple' ? (
							<div className="divide-y border-t">
								{(tide.events as TidePrediction[])
									.filter((event: TidePrediction) => tideTimestamp(event.time) > now)
									.slice(0, type === 'detailed' ? 6 : density === 'compact' ? 2 : 4)
									.map((event: TidePrediction) => (
										<div
											key={`${event.time}-${event.type}`}
											className={`flex justify-between gap-2 text-xs ${density === 'compact' ? 'py-2' : 'py-3'}`}
										>
											<span className="flex items-center gap-1">
												{event.type === 'H' ? (
													<ArrowUp className="size-3" aria-hidden="true" />
												) : (
													<ArrowDown className="size-3" aria-hidden="true" />
												)}
												{event.type === 'H' ? 'High tide' : 'Low tide'}
											</span>
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
				{sourceLabel ? <p className="text-[10px] text-muted-foreground">{sourceLabel}</p> : null}
			</CardContent>
		</Card>
	);
}

export default TideForecast;
