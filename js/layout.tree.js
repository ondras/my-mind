MM.Layout.Tree = function() {
	MM.Layout.call(this);
	this._addStyle("reset.css");
	this._addStyle("tree.css");
}
MM.Layout.Tree.prototype = Object.create(MM.Layout.prototype);

MM.Layout.Tree.prototype.pickItem = function(item, direction) {
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

MM.Layout.Tree.prototype.layoutItem = function(item) {
	return this._layoutItem(item, "bottom");
}
