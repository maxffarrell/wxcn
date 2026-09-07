import { useState } from 'react';
import { ForecastDashboard } from '@wxcn/react';
import { Button } from '@/components/ui/button';
import type { CardDensity, CardSize, ForecastType, WeatherBackground } from '@wxcn/core/types.js';

export function ReactPreview() {
	const [dark, setDark] = useState(false);
	const [size, setSize] = useState<CardSize>('default');
	const [density, setDensity] = useState<CardDensity>('comfortable');
	const [type, setType] = useState<ForecastType>('summary');
	const [metric, setMetric] = useState(false);
	const [background, setBackground] = useState<WeatherBackground>('none');
	return (
		<div className={dark ? 'dark' : ''}>
			<main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8">
				<div className="mx-auto max-w-6xl space-y-8">
					<header className="space-y-3">
						<a href="/" className="text-sm text-muted-foreground">
							wxcn / React
						</a>
						<h1 className="text-3xl font-semibold tracking-tight">Forecast components for React</h1>
						<p className="text-sm text-muted-foreground">
							Editable shadcn/ui components. Austin weather and moon, with coastal tide fixtures.
							Sample data, not live conditions.
						</p>
					</header>
					<div className="flex flex-wrap items-center gap-3">
						<Button variant="outline" onClick={() => setDark(!dark)} aria-pressed={dark}>
							Dark mode
						</Button>
						<Button variant="outline" onClick={() => setMetric(!metric)} aria-pressed={metric}>
							Metric units
						</Button>
						<label className="flex items-center gap-2 text-sm">
							Background
							<select
								className="rounded-md border bg-background p-2"
								value={background}
								onChange={(e) => setBackground(e.target.value as WeatherBackground)}
							>
								<option value="none">None</option>
								<option value="realistic">Realistic</option>
								<option value="dithered">Dithered</option>
								<option value="gradient">Gradient</option>
							</select>
						</label>
						<label className="flex items-center gap-2 text-sm">
							Size
							<select
								className="rounded-md border bg-background p-2"
								value={size}
								onChange={(e) => setSize(e.target.value as CardSize)}
							>
								<option value="sm">Small</option>
								<option value="default">Default</option>
								<option value="lg">Large</option>
							</select>
						</label>
						<label className="flex items-center gap-2 text-sm">
							Density
							<select
								className="rounded-md border bg-background p-2"
								value={density}
								onChange={(e) => setDensity(e.target.value as CardDensity)}
							>
								<option value="comfortable">Comfortable</option>
								<option value="compact">Compact</option>
							</select>
						</label>
						<label className="flex items-center gap-2 text-sm">
							Detail
							<select
								className="rounded-md border bg-background p-2"
								value={type}
								onChange={(e) => setType(e.target.value as ForecastType)}
							>
								<option value="simple">Simple</option>
								<option value="summary">Summary</option>
								<option value="detailed">Detailed</option>
							</select>
						</label>
					</div>
					<ForecastDashboard
						size={size}
						density={density}
						type={type}
						weatherUnit={metric ? 'celsius' : 'fahrenheit'}
						windUnit={metric ? 'km/h' : 'mph'}
						tideUnit={metric ? 'meter' : 'ft'}
						timeZone="America/Chicago"
						interactive
						background={background}
						showHighLow
						showTemperatureTrend
					/>
					<section className="space-y-3">
						<h2 className="text-lg font-medium">Install</h2>
						<pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-xs">
							<code>npx shadcn@latest add https://wxcn.dev/r/react/forecast-dashboard.json</code>
						</pre>
						<p className="text-sm text-muted-foreground">
							Use WeatherForecast, TideForecast, or MoonForecast individually. Pass your own
							provider data and source label. React uses the configured native icon library and
							Recharts; Svelte preset codes do not apply.
						</p>
					</section>
				</div>
			</main>
		</div>
	);
}
