export type FileTree = { name: string; path?: string; children?: FileTree[] };
// The native manual viewer expects one group with selectable files. Keep full
// destination paths in the labels so every registry helper remains accessible.
export function createFileTreeForRegistryItemFiles(
	files: { target: string }[] | undefined
): FileTree[] {
	return files?.length
		? [{ name: 'Files', children: files.map((file) => ({ name: file.target, path: file.target })) }]
		: [];
}
