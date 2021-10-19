import Shape from "./shape.js";
import Item from "../item.js";


const VERTICAL_OFFSET = -3;

export default class Underline extends Shape {
	constructor() {
		super("underline", "Underline");
	}

	update(item: Item) {
		const { contentPosition, contentSize, ctx } = item;

		ctx.strokeStyle = item.resolvedColor;

		var left = contentPosition[0];
		var right = left + contentSize[0];

		var top = this.getVerticalAnchor(item);

		ctx.beginPath();
		ctx.moveTo(left, top);
		ctx.lineTo(right, top);
		ctx.stroke();
	}

	getVerticalAnchor(item) {
		const { contentPosition, contentSize } = item;
		return contentPosition[1] + contentSize[1] + VERTICAL_OFFSET + 0.5;
	}
}

new Underline();