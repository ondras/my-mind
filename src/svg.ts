const NS = "http://www.w3.org/2000/svg";

export function node<T extends keyof SVGElementTagNameMap>(name: T): SVGElementTagNameMap[T] {
	let node = document.createElementNS(NS, name);
	return node;
}

export function group() {
	return node("g");
}

export function foreignObject() {
	let fo = node("foreignObject") ;

	// firefox needs dimensions. without them, the inner HTML content would have weird metrics
	fo.setAttribute("width", "1");
	fo.setAttribute("height", "1");
	return fo;
}
