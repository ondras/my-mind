MM.Layout.Up = Object.create(MM.Layout);
MM.Layout.Up.childDirection = "top";

MM.Layout.Up.update = function(item) {
	this._layoutItem(item, this.childDirection);
	this._drawLinesVertical(item, this.childDirection);

	return this;
}
