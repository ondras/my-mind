MM.Layout.Right = Object.create(MM.Layout);

MM.Layout.Right.update = function(item) {
	this._reset(item);

	this._layoutItem(item, "right");
//	this._drawLinesHorizontal(item, "left");

	return this;
}
