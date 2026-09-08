import { TideForecast } from '@/components/wxcn/tide-forecast';

export default function Example() {
	return (
		<div className="w-full max-w-sm">
			<TideForecast interactive unit="meter" />
		</div>
	);
}
