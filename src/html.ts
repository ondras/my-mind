export function node<T extends keyof HTMLElementTagNameMap>(name: T, attrs?: Record<string, string>): HTMLElementTagNameMap[T] {
	let node = document.createElement(name);
	Object.assign(node, attrs);
	return node;
}
