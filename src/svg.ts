const NS = "http://www.w3.org/2000/svg";

export function node<T extends keyof SVGElementTagNameMap>(name: T): SVGElementTagNameMap[T] {
	let node = document.createElementNS(NS, name);
	return node;
}
