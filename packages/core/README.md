# @wxcn/core

Framework-independent TypeScript data types, weather units, moon calculations, tide state calculations, fetch helpers, and deterministic sample fixtures.

Workspace consumers import subpaths such as `@wxcn/core/weather.js`. Registry builds copy these helpers into the consumer's project and rewrite imports, so registry users do not need an npm dependency on this workspace package.

Keep this package free of Svelte, React, Vue, and component-library dependencies. Do not add module-level access to browser globals or server credentials.
