import { WeatherForecast } from '@/components/wxcn/weather-forecast';

export default function Example() {
	return (
		<div className="w-full max-w-sm">
			<WeatherForecast
				interactive
				unit="celsius"
				background="realistic"
				showTemperatureTrend
				showHighLow
			/>
		</div>
	);
}
