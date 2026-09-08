import { defineComponent, h } from 'vue';
import { cn } from '../../lib/utils';
export const Button = defineComponent({
	name: 'Button',
	inheritAttrs: false,
	props: {
		variant: { type: String, default: 'default' },
		size: { type: String, default: 'default' }
	},
	setup(props, { attrs, slots }) {
		return () =>
			h(
				'button',
				{
					type: 'button',
					...attrs,
					class: cn(
						'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
						props.variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
						props.size === 'sm' ? 'h-8 px-3' : 'h-9 px-4',
						attrs.class as string
					)
				},
				slots.default?.()
			);
	}
});
