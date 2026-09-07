import * as React from 'react';

import { cn } from '@/lib/utils';

export type MoonDiscProps = React.SVGProps<SVGSVGElement> & {
	phase?: number;
	label?: string;
};

export function MoonDisc({ phase = 0.5, label = 'Full moon', className, ...props }: MoonDiscProps) {
	const id = React.useId().replace(/:/g, '');
	const p = ((phase % 1) + 1) % 1;
	const waxing = p <= 0.5;
	const sign = waxing ? 1 : -1;
	const terminator = Math.cos(p * Math.PI * 2) * sign;
	const points = Array.from({ length: 97 }, (_, i) => {
		const y = 1 - i / 48;
		return `${50 + 46 * Math.sqrt(Math.max(0, 1 - y * y)) * terminator} ${50 + 46 * y}`;
	});
	const light = `M50 4 A46 46 0 0 ${waxing ? 1 : 0} 50 96 L${points.join(' L')} Z`;

	return (
		<svg viewBox="0 0 100 100" className={cn(className)} role="img" aria-label={label} {...props}>
			<defs>
				<radialGradient id={`${id}-surface`} cx="42%" cy="38%" r="65%">
					<stop stopColor="#f1f1ed" />
					<stop offset=".72" stopColor="#d9dad5" />
					<stop offset="1" stopColor="#a8aca8" />
				</radialGradient>
			</defs>
			<circle cx="50" cy="50" r="46" fill="#30343a" />
			<path d={light} fill={`url(#${id}-surface)`} />
			<circle
				cx="50"
				cy="50"
				r="46"
				fill="none"
				stroke="currentColor"
				strokeOpacity=".08"
				strokeWidth=".5"
			/>
		</svg>
	);
}

export default MoonDisc;
