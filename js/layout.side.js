MM.Layout.Side = Object.create(MM.Layout);
MM.Layout.Side.childDirection = "";
MM.Layout.Side.getChildDirection = function(item) {
	return this.childDirection;
}
MM.Layout.Side.update = function(item) {
	this._layoutItem(item, this.childDirection);
	if (this.childDirection == "left" || this.childDirection == "right") {
		this._drawLinesHorizontal(item, this.childDirection);
	} else {
		this._drawLinesVertical(item, this.childDirection);
	}
	return this;
}

MM.Layout.Down = Object.create(MM.Layout.Side);
MM.Layout.Down.childDirection = "bottom";

MM.Layout.Up = Object.create(MM.Layout.Side);
MM.Layout.Up.childDirection = "top";

MM.Layout.Left = Object.create(MM.Layout.Side);
MM.Layout.Left.childDirection = "left";

MM.Layout.Right = Object.create(MM.Layout.Side);
MM.Layout.Right.childDirection = "right";
