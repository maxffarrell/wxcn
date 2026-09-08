# Cross-framework component contract

`frameworks.json` records supported component names and installer routing. An empty component list means no implementation is available. Reserved React/Vue packages must not produce fake installable items.

All implementations should use the same fixture data in `packages/core/src` and the same inputs when comparing previews:

- Weather: clear, rain, snow, night; Fahrenheit/Celsius and supported wind units.
- Tides: fresh observation, stale observation, predictions only, missing data; feet/meters; previous/next extrema and hovered time/level.
- Moon: new, first quarter, full, last quarter; identical date and location inputs.
- Presentation: light/dark, small/default/large, compact/comfortable, simple/summary/detailed.
- Layout and behavior: narrow containers, keyboard navigation, reduced motion, SSR without browser globals, and clearly labeled fixtures when live data is unavailable.

Core is pure TypeScript with no component framework dependency. The existing `IconSet` type retains legacy Svelte spellings for compatibility. React defines native icon names locally for Lucide, Tabler, Phosphor, Hugeicons, and Remixicon; new frameworks should define native icon types locally rather than expand this into a universal icon adapter.

Frameworks share semantic props and outcomes. Their rendering, icon support, chart libraries, and lifecycle implementations can differ. The React site and standalone preview provide native SSR, hydration, and interaction coverage. Preset portability must be demonstrated against the relevant upstream implementation.
