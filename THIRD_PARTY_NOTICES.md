# shadcn-svelte

The UI primitives in `packages/svelte/src/components/ui/` and the site components (mobile navigation, mode switcher, GitHub link, PMBlock, clipboard and package-manager utilities) are derived from https://github.com/huntabyte/shadcn-svelte, retrieved September 6, 2026. The create-layout reference is PR #2755 at commit 07d9093edfd3bf8d599fb874c5e37645b9e41127.

The component preview, installation tabs, documentation tabs and steps, and chart components preserve the upstream implementation from that reference (UI utility imports are relative to the Svelte package). The theme palettes, font definitions, theme builder, and card style rules also come from the same reference. Preset encoding is provided directly by `shadcn-svelte/preset`.

MIT License

Copyright (c) 2023 Hunter Johnston <https://github.com/huntabyte>
Copyright (c) 2023 CokaKoala <https://github.com/adriangonz97>
Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

The manual installation source viewer, file controls, language icons, and steps use PR #2761 at b209b923033ae5c10602cf668fd1ae7a0dc21a7c. Its data/type adapters point to wxcn registry files. The Card implementation was checked against upstream main and matches apart from the local utility import.

The MDSX heading components in `apps/web/src/lib/components/mdsx` are copied from the shadcn-svelte documentation (MIT), including its heading anchor behavior.
