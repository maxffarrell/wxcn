import type { IconSet } from '../../icons/forecast-icons';
import type {
	ForecastType,
	LocationInput,
	TideUnit,
	WeatherUnit,
	CurrentWeather
} from '@wxcn/core/types.js';
import { WeatherForecast } from './weather-forecast';
import { TideForecast } from './tide-forecast';
import { MoonForecast } from './moon-forecast';

export type ForecastDashboardProps = {
	iconType?: IconSet;
	timeZone?: string;
	type?: ForecastType;
	size?: 'sm' | 'default' | 'lg';
	density?: 'compact' | 'comfortable';
	weatherUnit?: WeatherUnit;
	windUnit?: 'mph' | 'km/h' | 'm/s' | 'knots';
	tideUnit?: TideUnit;
	animatedWeatherBackground?: boolean;
	showTemperatureTrend?: boolean;
	showHighLow?: boolean;
	currentWeather?: CurrentWeather | null;
	location?: LocationInput;
	tideLocation?: LocationInput;
};

export function ForecastDashboard({
	iconType,
	timeZone,
	type = 'summary',
	size = 'default',
	density = 'comfortable',
	weatherUnit = 'fahrenheit',
	windUnit = 'mph',
	tideUnit = 'ft',
	animatedWeatherBackground = false,
	showTemperatureTrend = false,
	showHighLow = false,
	currentWeather,
	tideLocation,
	location
}: ForecastDashboardProps) {
	return (
		<div className="@container/dashboard w-full">
			<div className="grid items-start gap-4 @min-[38rem]/dashboard:grid-cols-2 @min-[52rem]/dashboard:grid-cols-3">
				<div className="min-w-0 @min-[38rem]/dashboard:col-span-2 @min-[52rem]/dashboard:col-span-1">
					<WeatherForecast
						iconType={iconType}
						timeZone={timeZone}
						type={type}
						size={size}
						density={density}
						unit={weatherUnit}
						windUnit={windUnit}
						location={location}
						animatedBackground={animatedWeatherBackground}
						showTemperatureTrend={showTemperatureTrend}
						showHighLow={showHighLow}
						currentWeather={currentWeather}
					/>
				</div>
				<TideForecast
					iconType={iconType}
					timeZone={timeZone}
					type={type}
					size={size}
					density={density}
					unit={tideUnit}
					location={tideLocation}
				/>
				<MoonForecast
					timeZone={timeZone}
					type={type}
					size={size}
					density={density}
					location={location}
				/>
			</div>
		</div>
	);
}

export default ForecastDashboard;
