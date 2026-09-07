'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ForecastIcon, type IconSet } from '../../icons/forecast-icons';
import type { ForecastDay } from '@wxcn/core/forecast-days.js';
export type ForecastAction = (onSurface: boolean) => ReactNode;
export type OpenForecastDay = (time: string, trigger: HTMLElement) => void;
export interface ForecastScreensProps {
	interactive: boolean;
	days: ForecastDay[];
	title: string;
	density: string;
	sourceLabel: string;
	summary?: (availableHeight: number) => ReactNode;
	actionLabel?: string;
	showWeek?: boolean;
	iconType?: IconSet;
	flush?: boolean;
	detail: (day: ForecastDay, action: ForecastAction) => ReactNode;
	children: (
		openDay: OpenForecastDay,
		action: ForecastAction,
		overviewVisible: boolean
	) => ReactNode;
}
export function ForecastScreens({
	interactive,
	days,
	title,
	summary,
	actionLabel = 'View week',
	showWeek = true,
	iconType,
	flush = false,
	detail,
	children
}: ForecastScreensProps) {
	const [screen, setScreen] = useState<'overview' | 'week' | 'day'>('overview');
	const [selectedKey, setSelectedKey] = useState('');
	const [availableHeight, setAvailableHeight] = useState(0);
	const surface = useRef<HTMLDivElement>(null);
	const table = useRef<HTMLDivElement>(null);
	const host = useRef<HTMLElement | null>(null);
	const fromWeek = useRef(false);
	const originIndex = useRef(0);
	const originTrigger = useRef<HTMLElement | null>(null);
	const focusTarget = useRef<'surface' | 'origin' | 'day' | null>(null);
	const selected = days.find((day) => day.key === selectedKey);
	const active = interactive && (screen !== 'day' || selected) ? screen : 'overview';
	useEffect(() => {
		if (active !== screen) setScreen('overview');
	}, [active, screen]);
	useLayoutEffect(() => {
		if (active !== 'week' || !table.current) return;
		const node = table.current;
		const update = () => setAvailableHeight(node.clientHeight);
		const observer = new ResizeObserver(update);
		observer.observe(node);
		update();
		return () => observer.disconnect();
	}, [active]);
	useLayoutEffect(() => {
		const target = focusTarget.current;
		if (!target) return;
		if (target === 'surface') {
			surface.current?.focus({ preventScroll: true });
			focusTarget.current = null;
			return;
		}
		if ((target === 'day' && active !== 'week') || (target === 'origin' && active !== 'overview'))
			return;
		// Wait for the retained overview or resized detail surface to become visible.
		let frame = requestAnimationFrame(() => {
			frame = requestAnimationFrame(() => {
				const trigger =
					target === 'day'
						? host.current?.querySelector<HTMLButtonElement>(`[data-forecast-day="${selectedKey}"]`)
						: originTrigger.current?.isConnected
							? originTrigger.current
							: host.current?.querySelectorAll<HTMLButtonElement>('button')[originIndex.current];
				trigger?.focus({ preventScroll: true });
				if (document.activeElement === trigger) focusTarget.current = null;
			});
		});
		return () => cancelAnimationFrame(frame);
	}, [active, selectedKey, availableHeight]);

	function open(next: 'week' | 'day', trigger: HTMLElement, key = '') {
		if (active === 'overview') {
			host.current = trigger.closest<HTMLElement>('[data-slot=card]');
			originTrigger.current = trigger;
			originIndex.current = host.current
				? [...host.current.querySelectorAll('button')].indexOf(trigger as HTMLButtonElement)
				: 0;
		}
		fromWeek.current = active === 'week';
		setSelectedKey(key);
		focusTarget.current = 'surface';
		setScreen(next);
	}
	const openDay: OpenForecastDay = (time, trigger) => {
		const day = days.find((day) => day.entries.some((entry) => entry.time === Date.parse(time)));
		if (day) open('day', trigger, day.key);
	};
	function back() {
		if (active === 'day' && fromWeek.current) {
			focusTarget.current = 'day';
			setScreen('week');
		} else {
			focusTarget.current = 'origin';
			setScreen('overview');
		}
	}
	const weekAction: ForecastAction = (onSurface) =>
		interactive && showWeek ? (
			<CardAction>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className={`h-6 px-1.5 text-[10px] font-medium ${onSurface ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
					aria-label={summary ? actionLabel : `View ${title.toLowerCase()} week`}
					onClick={(event) => open('week', event.currentTarget)}
				>
					{actionLabel}
				</Button>
			</CardAction>
		) : null;
	const backAction: ForecastAction = (onSurface) => (
		<CardAction>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className={`h-6 gap-1 px-1.5 text-[10px] ${onSurface ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-muted-foreground'}`}
				onClick={back}
			>
				<ForecastIcon name="arrowDown" iconSet={iconType} className="size-3 rotate-90" />
				Back
			</Button>
		</CardAction>
	);
	return (
		<>
			<div
				className="contents"
				style={{ visibility: active === 'overview' ? 'visible' : 'hidden' }}
				inert={active !== 'overview'}
				aria-hidden={active !== 'overview'}
			>
				{children(openDay, weekAction, active === 'overview')}
			</div>
			{active !== 'overview' && (
				<div
					ref={surface}
					tabIndex={-1}
					role="group"
					aria-label={
						active === 'day'
							? `${selected?.label} ${title.toLowerCase()} forecast`
							: `${title} week`
					}
					data-slot="forecast-screen"
					onKeyDown={(event) => {
						if (event.key === 'Escape') {
							event.preventDefault();
							back();
						}
					}}
					className={`absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden rounded-[inherit] bg-card text-card-foreground outline-none ${active === 'day' && flush ? 'gap-0' : active === 'week' ? 'gap-2 py-3' : 'gap-[var(--card-spacing,var(--wxcn-spacing,1.5rem))] py-[var(--card-spacing,var(--wxcn-spacing,1.5rem))]'}`}
				>
					{active === 'day' && selected ? (
						detail(selected, backAction)
					) : (
						<>
							<CardHeader className="shrink-0">
								<CardTitle className="truncate">
									{summary ? 'Upcoming tides' : `${title} week`}
								</CardTitle>
								{backAction(false)}
							</CardHeader>
							<CardContent className="min-h-0 min-w-0 flex-1">
								<div ref={table} className="h-full min-h-0" data-slot="forecast-week-table">
									{summary ? (
										summary(availableHeight)
									) : (
										<div
											className={`grid h-full content-start gap-x-3 ${availableHeight < days.length * 28 ? 'grid-cols-2' : 'grid-cols-1'}`}
										>
											{days.map((day) => (
												<button
													key={day.key}
													type="button"
													data-forecast-day={day.key}
													style={{
														height: Math.min(
															28,
															availableHeight /
																(availableHeight < days.length * 28
																	? Math.ceil(days.length / 2)
																	: days.length)
														)
													}}
													className="flex min-h-0 min-w-0 items-center justify-between gap-2 border-b text-left text-[11px] hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
													aria-label={`View details for ${day.label}`}
													onClick={(event) => open('day', event.currentTarget, day.key)}
												>
													<span className="shrink-0 font-medium">{day.label}</span>
													<span
														className="truncate text-muted-foreground"
														title={day.entries.map((entry) => entry.summary).join(' · ')}
													>
														{day.entries.map((entry) => entry.summary).join(' · ')}
													</span>
												</button>
											))}
										</div>
									)}
								</div>
							</CardContent>
						</>
					)}
				</div>
			)}
		</>
	);
}
