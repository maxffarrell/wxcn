'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
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
	sourceLabel,
	showWeek = true,
	iconType,
	flush = false,
	detail,
	children
}: ForecastScreensProps) {
	const [screen, setScreen] = useState<'overview' | 'week' | 'day'>('overview');
	const [selectedKey, setSelectedKey] = useState('');
	const [pageSize, setPageSize] = useState(1);
	const measuredPageSize = useRef(1);
	const [page, setPage] = useState(0);
	const surface = useRef<HTMLDivElement>(null);
	const table = useRef<HTMLDivElement>(null);
	const host = useRef<HTMLElement | null>(null);
	const fromWeek = useRef(false);
	const originIndex = useRef(0);
	const originTrigger = useRef<HTMLElement | null>(null);
	const focusTarget = useRef<'surface' | 'origin' | 'day' | null>(null);
	const selected = days.find((day) => day.key === selectedKey);
	const pageCount = Math.max(1, Math.ceil(days.length / pageSize));
	const currentPage = Math.min(page, pageCount - 1);
	const visibleDays = days.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
	const active = interactive && (screen !== 'day' || selected) ? screen : 'overview';
	useEffect(() => {
		if (active !== screen) setScreen('overview');
	}, [active, screen]);
	useEffect(() => {
		if (page >= pageCount) setPage(pageCount - 1);
	}, [page, pageCount]);
	useLayoutEffect(() => {
		if (active !== 'week' || !table.current) return;
		const node = table.current;
		const update = () => {
			measuredPageSize.current = Math.max(
				1,
				Math.floor((node.clientHeight - 24 - (sourceLabel ? 22 : 0)) / 32)
			);
			setPageSize(measuredPageSize.current);
		};
		const observer = new ResizeObserver(update);
		observer.observe(node);
		update();
		return () => observer.disconnect();
	}, [active, sourceLabel]);
	useLayoutEffect(() => {
		const target = focusTarget.current;
		if (!target) return;
		if (target === 'surface') surface.current?.focus({ preventScroll: true });
		else if (target === 'day') {
			if (active !== 'week') return;
			let frame = requestAnimationFrame(() => {
				frame = requestAnimationFrame(() => {
					const measured = Math.max(
						1,
						Math.floor(((table.current?.clientHeight ?? 0) - 24 - (sourceLabel ? 22 : 0)) / 32)
					);
					const selectedPage = Math.floor(
						days.findIndex((day) => day.key === selectedKey) / measured
					);
					if (pageSize !== measured || currentPage !== selectedPage) {
						setPageSize(measured);
						setPage(selectedPage);
						return;
					}
					const button = host.current?.querySelector<HTMLButtonElement>(
						`[data-forecast-day="${selectedKey}"]`
					);
					button?.focus({ preventScroll: true });
					if (document.activeElement === button) focusTarget.current = null;
				});
			});
			return () => cancelAnimationFrame(frame);
		} else {
			if (active !== 'overview') return;
			// Let the retained overview become visible before restoring keyboard focus.
			let frame = requestAnimationFrame(() => {
				frame = requestAnimationFrame(() => {
					const trigger = originTrigger.current?.isConnected
						? originTrigger.current
						: host.current?.querySelectorAll<HTMLButtonElement>('button')[originIndex.current];
					trigger?.focus({ preventScroll: true });
					focusTarget.current = null;
				});
			});
			return () => cancelAnimationFrame(frame);
		}

		focusTarget.current = null;
	}, [active, currentPage, selectedKey, pageSize, days, sourceLabel]);
	function open(next: 'week' | 'day', trigger: HTMLElement, key = '') {
		if (active === 'overview') {
			host.current = trigger.closest<HTMLElement>('[data-slot=card]');
			originTrigger.current = trigger;
			originIndex.current = host.current
				? [...host.current.querySelectorAll('button')].indexOf(trigger as HTMLButtonElement)
				: 0;
			setPage(0);
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
			setPage(Math.floor(days.findIndex((day) => day.key === selectedKey) / pageSize));
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
					aria-label={`View ${title.toLowerCase()} week`}
					onClick={(event) => open('week', event.currentTarget)}
				>
					View week
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
					className={`absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden rounded-[inherit] bg-card text-card-foreground outline-none ${active === 'day' && flush ? 'gap-0' : 'gap-[var(--card-spacing,var(--wxcn-spacing,1.5rem))] py-[var(--card-spacing,var(--wxcn-spacing,1.5rem))]'}`}
				>
					{active === 'day' && selected ? (
						detail(selected, backAction)
					) : (
						<>
							<CardHeader className="shrink-0">
								<CardTitle className="truncate">{title} week</CardTitle>
								<CardDescription className="text-xs" aria-live="polite">
									{days.length
										? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, days.length)} of ${days.length} days`
										: 'No forecast available'}
								</CardDescription>
								<CardAction className="flex items-center gap-0.5">
									{pageCount > 1 && (
										<>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="size-6 p-0"
												aria-label="Previous forecast days"
												disabled={currentPage === 0}
												onClick={() => setPage(currentPage - 1)}
											>
												<ForecastIcon
													name="arrowDown"
													iconSet={iconType}
													className="size-3 rotate-90"
												/>
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="size-6 p-0"
												aria-label="Next forecast days"
												disabled={currentPage === pageCount - 1}
												onClick={() => setPage(currentPage + 1)}
											>
												<ForecastIcon
													name="arrowDown"
													iconSet={iconType}
													className="size-3 -rotate-90"
												/>
											</Button>
										</>
									)}
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-6 px-1.5 text-[10px] text-muted-foreground"
										onClick={back}
									>
										Back
									</Button>
								</CardAction>
							</CardHeader>
							<CardContent className="min-h-0 min-w-0 flex-1">
								<div ref={table} className="h-full min-h-0" data-slot="forecast-week-table">
									{days.length > 0 && (
										<table className="w-full table-fixed text-left text-xs">
											<caption className="sr-only">{title} weekly summary</caption>
											<thead className="h-6 text-muted-foreground">
												<tr className="border-b">
													<th scope="col" className="w-2/5 pr-2 font-normal">
														Day
													</th>
													<th scope="col" className="font-normal">
														Forecast
													</th>
												</tr>
											</thead>
											<tbody className="divide-y">
												{visibleDays.map((day) => (
													<tr key={day.key} className="h-8">
														<th scope="row" className="pr-2 font-medium">
															<button
																data-forecast-day={day.key}
																type="button"
																className="min-h-6 text-left text-[11px] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
																aria-label={`View details for ${day.label}`}
																onClick={(event) => open('day', event.currentTarget, day.key)}
															>
																{day.label}
															</button>
														</th>
														<td>
															<p
																className="truncate"
																title={day.entries.map((entry) => entry.summary).join(' · ')}
															>
																{day.entries.map((entry) => entry.summary).join(' · ')}
															</p>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									)}
									{sourceLabel && (
										<p
											className="mt-2 truncate text-[10px] text-muted-foreground"
											title={sourceLabel}
										>
											{sourceLabel}
										</p>
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
