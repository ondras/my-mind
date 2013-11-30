MM.Layout.FreeMind = function() {
	MM.Layout.call(this);
	this._addStyle("reset.css");
	this._addStyle("freemind.css");
}
MM.Layout.FreeMind.prototype = Object.create(MM.Layout.prototype);

MM.Layout.FreeMind.prototype.pickItem = function(item, direction) {
	switch (direction) {
		case 37: /* left */
			if (!item.getParent()) { return this._pickSide(item, "left"); } 
			var side = this._getSide(item);
			return (side == "right" ? this._pickParent(item) : this._pickChild(item));
		break;
		case 38: /* top */
			return this._pickSibling(item, -1);
		break;
		case 39: /* right */
			if (!item.getParent()) { return this._pickSide(item, "right"); } 
			var side = this._getSide(item);
			return (side == "left" ? this._pickParent(item) : this._pickChild(item));
		break;
		case 40: /* down */
			return this._pickSibling(item, +1);
		break;
	}
}

MM.Layout.FreeMind.prototype.updateItem = function(item) {
	if (item.getParent()) {
		var side = this._getSide(item);
		return this._updateItem(item, side);
	} else {
		this._updateRoot(item);
	}
}

MM.Layout.FreeMind.prototype._getSide = function(item) {
	while (item.getParent().getParent()) {
		item = item.getParent();
	}
	var children = item.getParent().getChildren();
	var index = children.indexOf(item);
	return (index % 2 ? "left" : "right");
}

MM.Layout.FreeMind.prototype._updateRoot = function(item) {
	var dom = item.getDOM();

	var totalLeft = 0;
	var totalRight = 0;
	var children = item.getChildren();

	children.forEach(function(child, index) {
		var node = child.getDOM().node;
		var side = this._getSide(child);
		
		if (side == "left") {
			node.style.right = dom.content.offsetWidth + "px";
			node.style.top = totalLeft+"px";
			totalLeft += node.offsetHeight;
		} else {
			node.style.left = dom.content.offsetWidth + "px";
			node.style.top = totalRight+"px";
			totalRight += node.offsetHeight;
		}
	}, this);
}

MM.Layout.FreeMind.prototype._pickSide = function(item, side) {
	var children = item.getChildren();
	var index = (side == "right" ? 0 : 1);
	return (children.length > index+1 ? children[index] : item);
}
