MM.Layout.Right = Object.create(MM.Layout);
MM.Layout.Right.childDirection = "right";

MM.Layout.Right.update = function(item) {
	this._layoutItem(item, this.childDirection);
	this._drawLinesHorizontal(item, this.childDirection);
	return this;
}
