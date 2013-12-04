MM.Layout.FreeMind = Object.create(MM.Layout);

MM.Layout.FreeMind.pick = function(item, direction) {
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

MM.Layout.FreeMind.update = function(item) {
	this._reset(item);

	if (item.getParent()) {
		var side = this._getSide(item);
		var name = side.charAt(0).toUpperCase() + side.substring(1);
		MM.Layout[name].update(item);
	} else {
		this._layoutRoot(item);
	}
}

MM.Layout.FreeMind._getSide = function(item) {
	while (item.getParent().getParent()) {
		item = item.getParent();
	}
	var children = item.getParent().getChildren();
	var index = children.indexOf(item);
	return (index % 2 ? "left" : "right");
}

MM.Layout.FreeMind._pickSibling = function(item, dir) {
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

MM.Layout.FreeMind._layoutRoot = function(item) {
	var dom = item.getDOM();
	var children = item.getChildren();

	var heightLeft = 0;
	var heightRight = 0;
	var childrenLeft = [];
	var childrenRight = [];

	children.forEach(function(child, index) {
		var node = child.getDOM().node;
		var side = this._getSide(child);
		
		if (side == "left") {
			heightLeft += node.offsetHeight;
			childrenLeft.push(child);
		} else {
			heightRight += node.offsetHeight;
			childrenRight.push(child);
		}
	}, this);

	var height = Math.max(heightLeft, heightRight, dom.content.offsetHeight);
	var topLeft = Math.round((height-heightLeft)/2);
	var topRight = Math.round((height-heightRight)/2);

	children.forEach(function(child, index) {
		var node = child.getDOM().node;
		var side = this._getSide(child);
		
		if (side == "left") {
			node.style.left = "";
			node.style.right = (dom.content.offsetWidth + MM.Layout.SPACING) + "px";
			node.style.top = topLeft+"px";
			topLeft += node.offsetHeight;
		} else {
			node.style.right = "";
			node.style.left = (dom.content.offsetWidth + MM.Layout.SPACING) + "px";
			node.style.top = topRight+"px";
			topRight += node.offsetHeight;
		}
	}, this);

	dom.content.style.top = Math.round((height - dom.content.offsetHeight)/2) + "px";
	dom.node.style.height = height + "px";

	this._anchorRootCanvas(item, childrenLeft, childrenRight);
	this._drawHorizontalConnectors(item, "left", childrenLeft);
	this._drawHorizontalConnectors(item, "right", childrenRight);
}

MM.Layout.FreeMind._anchorRootCanvas = function(item, childrenLeft, childrenRight) {
	var dom = item.getDOM();
	var canvas = dom.canvas;

	var width = dom.node.offsetWidth;
	if (childrenLeft) { 
		canvas.style.left = (-MM.Layout.SPACING) + "px";
		width += MM.Layout.SPACING; 
	} else {
		canvas.style.left = 0;
	}
	if (childrenRight) { width += MM.Layout.SPACING; }

	canvas.width = width;
	canvas.height = dom.node.offsetHeight;

}

MM.Layout.FreeMind._pickSide = function(item, side) {
	var children = item.getChildren();
	var index = (side == "right" ? 0 : 1);
	return (children.length > index ? children[index] : item);
}
