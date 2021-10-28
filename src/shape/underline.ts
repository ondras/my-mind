import Shape from "./shape.js";
import Item from "../item.js";
import * as svg from "../svg.js";


const VERTICAL_OFFSET = -4;

export default class Underline extends Shape {
	constructor() {
		super("underline", "Underline");
	}

	update(item: Item) {
		const { contentPosition, resolvedColor, contentSize, dom } = item;

		let left = contentPosition[0];
		let right = left + contentSize[0];
		let top = this.getVerticalAnchor(item);

		let d = [
			`M ${left} ${top}`,
			`L ${right} ${top}`
		];
		let path = svg.node("path", {d:d.join(" "), stroke:resolvedColor, fill:"none"});
		dom.connectors.append(path);
	}

	getVerticalAnchor(item: Item) {
		const { contentPosition, contentSize } = item;
		return contentPosition[1] + contentSize[1] + VERTICAL_OFFSET + 0.5;
	}
}

new Underline();
