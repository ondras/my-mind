MM.Layout.Left = Object.create(MM.Layout);
MM.Layout.Left.childDirection = "left";

MM.Layout.Left.update = function(item) {
	this._layoutItem(item, this.childDirection);
	this._drawLinesHorizontal(item, this.childDirection);
	return this;
}
