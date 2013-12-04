MM.Layout.Down = Object.create(MM.Layout);

MM.Layout.Down.pick = function(item, direction) {
	switch (direction) {
		case 37: /* left */
			return this._pickSibling(item, -1);
		break;
		case 38: /* top */
			return this._pickParent(item);
		break;
		case 39: /* right */
			return this._pickSibling(item, +1);
		break;
		case 40: /* down */
			return this._pickChild(item);
		break;
	}
}

MM.Layout.Down.update = function(item) {
	this._reset(item);

	this._layoutItem(item, "top", "left", "height", "width");
	this._drawLinesVertical(item, "top");

	return this;
}
