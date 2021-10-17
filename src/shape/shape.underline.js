MM.Shape.Underline = Object.create(MM.Shape, {
	id: {value: "underline"},
	label: {value: "Underline"},
	VERTICAL_OFFSET: {value: -3}
});

MM.Shape.Underline.update = function(item) {
	const { contentPosition, contentSize, ctx } = item;

	ctx.strokeStyle = item.getColor();

	var left = contentPosition[0];
	var right = left + contentSize[0];

	var top = this.getVerticalAnchor(item);

	ctx.beginPath();
	ctx.moveTo(left, top);
	ctx.lineTo(right, top);
	ctx.stroke();
}

MM.Shape.Underline.getVerticalAnchor = function(item) {
	const { contentPosition, contentSize } = item;
	return contentPosition[1] + contentSize[1] + this.VERTICAL_OFFSET + 0.5;
}
