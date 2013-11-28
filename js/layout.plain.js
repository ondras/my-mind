MM.Layout.Plain = function() {
	MM.Layout.call(this);
	this._addStyle("plain.css");
}
MM.Layout.Plain.prototype = Object.create(MM.Layout.prototype);

MM.Layout.Plain.prototype.pickItem = function(item, direction) {
	switch (direction) {
		case 37: /* left */
			return this._pickParent(item);
		break;
		case 38: /* top */
			if (!item.getParent()) {
				var children = item.getChildren();
				return (children.length ? children[children.length-1] : item);
			} else {
				return this._pickSibling(item, -1);
			}
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
