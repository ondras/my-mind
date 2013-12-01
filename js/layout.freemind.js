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

MM.Layout.FreeMind.prototype._pickSibling = function(item, dir) {
	var parent = item.getParent();
	if (!parent) { return item; }

	var children = parent.getChildren();
	if (!parent.getParent()) {
		var side = this._getSide(item);
		children = children.filter(function(child) {
			return (this._getSide(child) == side);
		}, this);
	}
	
	var index = children.indexOf(item);
	index += dir;
	index = (index+children.length) % children.length;
	return children[index];
}

MM.Layout.FreeMind.prototype._updateRoot = function(item) {
	var dom = item.getDOM();
	var children = item.getChildren();

	var heightLeft = 0;
	var heightRight = 0;

	children.forEach(function(child, index) {
		var node = child.getDOM().node;
		var side = this._getSide(child);
		
		if (side == "left") {
			heightLeft += node.offsetHeight;
		} else {
			heightRight += node.offsetHeight;
		}
	}, this);

	var height = Math.max(heightLeft, heightRight, dom.content.offsetHeight);
	var topLeft = Math.round((height-heightLeft)/2);
	var topRight = Math.round((height-heightRight)/2);

	children.forEach(function(child, index) {
		var node = child.getDOM().node;
		var side = this._getSide(child);
		
		if (side == "left") {
			node.style.right = (dom.content.offsetWidth + this._options.spacing) + "px";
			node.style.top = topLeft+"px";
			topLeft += node.offsetHeight;
		} else {
			node.style.left = (dom.content.offsetWidth + this._options.spacing) + "px";
			node.style.top = topRight+"px";
			topRight += node.offsetHeight;
		}
	}, this);

	dom.content.style.top = Math.round((height - dom.content.offsetHeight)/2) + "px";
}


MM.Layout.FreeMind.prototype._pickSide = function(item, side) {
	var children = item.getChildren();
	var index = (side == "right" ? 0 : 1);
	return (children.length > index+1 ? children[index] : item);
}
