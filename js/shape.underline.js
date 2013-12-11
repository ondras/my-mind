MM.Shape.Underline = Object.create(MM.Shape);
MM.Shape.Underline.VERTICAL_OFFSET = 0.85;
MM.Shape.Underline.id = "underline";
MM.Shape.ALL.push(MM.Shape.Underline);

MM.Shape.Underline.update = function(item) {
	var dom = item.getDOM();

	var ctx = dom.canvas.getContext("2d");
	ctx.strokeStyle = MM.LINE_COLOR;

	var left = dom.content.offsetLeft;
	var right = left + dom.content.offsetWidth;

	var top = this.getVerticalAnchor(item);

	ctx.beginPath();
	ctx.moveTo(left, top);
	ctx.lineTo(right, top);
	ctx.stroke();
}
