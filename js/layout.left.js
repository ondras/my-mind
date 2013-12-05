MM.Layout.Left = Object.create(MM.Layout);

MM.Layout.Left.update = function(item) {
	this._reset(item);

	this._layoutItem(item, "left");
//	this._drawLinesHorizontal(item, "right");

	return this;
}
