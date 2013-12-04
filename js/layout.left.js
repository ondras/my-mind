MM.Layout.Left = Object.create(MM.Layout);

MM.Layout.Left.update = function(item) {
	this._reset(item);

	this._layoutItem(item, "right", "top", "width", "height");
	this._drawLinesHorizontal(item, "right");

	return this;
}
