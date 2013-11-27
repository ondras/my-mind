MM.Layout.Plain = function() {
	MM.Layout.call(this);
	this._addStyle("plain");
}
MM.Layout.Plain.prototype = Object.create(MM.Layout.prototype);

MM.Layout.Plain.prototype.pickItem = function(item, direction) {
	switch (direction) {
		case 37: /* left */
			return this._pickParent(item);
		break;
		case 38: /* top */
			return this._pickSibling(item, -1);
		break;
		case 39: /* right */
			return this._pickChild(item);
		break;
		case 40: /* down */
			if (!item.getParent()) {
				return this._pickChild(item);
			} else {
				return this._pickSibling(item, +1);
			}
		break;
	}
}

MM.Layout.Plain.prototype._pickParent = function(item) {
	return item.getParent() || item;
}

MM.Layout.Plain.prototype._pickChild = function(item) {
	var children = item.getChildren();
	return (children.length ? children[0] : item);
}

MM.Layout.Plain.prototype._pickSibling = function(item, dir) {
	var parent = item.getParent();
	if (!parent) { return item; }

	var children = parent.getChildren();
	var index = children.indexOf(item);
	index += dir;
	index = (index+children.length) % children.length;
	return children[index];
}
