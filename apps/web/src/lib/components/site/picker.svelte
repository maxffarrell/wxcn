<script lang="ts">
	import * as Menu from '@wxcn/svelte/components/ui/dropdown-menu/index.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import PickerTrigger from './picker-trigger.svelte';
	import PickerContent from './picker-content.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
	const isMobile = new IsMobile();
	let {
		label,
		value = $bindable(''),
		options
	}: { label: string; value?: string; options: { value: string; label: string }[] } = $props();
</script>

<Menu.Root>
	<PickerTrigger
		class="relative w-40 shrink-0 touch-manipulation rounded-xl p-3 text-left ring-1 ring-foreground/10 select-none hover:bg-muted focus-visible:ring-foreground/50 focus-visible:outline-none data-[state=open]:bg-muted md:w-full md:rounded-lg md:px-2.5 md:py-2"
		aria-label={label}
	>
		<span class="block text-xs text-muted-foreground">{label}</span><span
			class="mt-1 flex items-center justify-between gap-2 text-sm"
			><span class="truncate">{options.find((o) => o.value === value)?.label ?? value}</span
			><ChevronDown class="size-3.5 shrink-0 text-muted-foreground" /></span
		>
	</PickerTrigger>
	<PickerContent
		side={isMobile.current ? 'top' : 'right'}
		align={isMobile.current ? 'center' : 'start'}
		sideOffset={20}
	>
		<Menu.RadioGroup bind:value
			>{#each options as option}<Menu.RadioItem
					value={option.value}
					class="gap-2 rounded-lg py-1.5 pl-2 font-medium focus:bg-neutral-600 focus:text-neutral-100 focus:**:text-neutral-100 dark:focus:bg-neutral-700/80 pointer-coarse:gap-3 pointer-coarse:py-2.5 pointer-coarse:pl-3 pointer-coarse:text-base"
					>{option.label}</Menu.RadioItem
				>{/each}</Menu.RadioGroup
		>
	</PickerContent>
</Menu.Root>
