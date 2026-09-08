import { defineComponent, h } from 'vue';
import { cn } from '../../lib/utils';
const el = (name: string, tag: string, base: string) =>
	defineComponent({
		name,
		inheritAttrs: false,
		setup(_, { attrs, slots }) {
			const slot = name.replace(/^Card/, 'card').replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
			return () =>
				h(
					tag,
					{ ...attrs, 'data-slot': slot, class: cn(base, attrs.class as string) },
					slots.default?.()
				);
		}
	});
export const Card = el('Card', 'div', 'cn-card group/card flex flex-col');
export const CardHeader = el(
	'CardHeader',
	'div',
	'cn-card-header grid auto-rows-min grid-rows-[auto_auto] items-start has-data-[slot=card-action]:grid-cols-[1fr_auto]'
);
export const CardTitle = el('CardTitle', 'div', 'cn-card-title');
export const CardDescription = el('CardDescription', 'div', 'cn-card-description');
export const CardAction = el(
	'CardAction',
	'div',
	'cn-card-action col-start-2 row-span-2 row-start-1 self-start justify-self-end'
);
export const CardContent = el('CardContent', 'div', 'cn-card-content');
export const CardFooter = el('CardFooter', 'div', 'cn-card-footer flex items-center');
