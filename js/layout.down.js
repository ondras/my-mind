MM.Layout.Down = Object.create(MM.Layout);
MM.Layout.Down.childDirection = "bottom";

MM.Layout.Down.update = function(item) {
	this._layoutItem(item, this.childDirection);
	this._drawLinesVertical(item, this.childDirection);

	return this;
}
