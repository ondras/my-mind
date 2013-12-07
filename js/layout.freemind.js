MM.Layout.FreeMind = Object.create(MM.Layout);
MM.Layout.FreeMind._left = [];
MM.Layout.FreeMind._right = [];

MM.Layout.FreeMind.update = function(item) {
	if (item.getParent()) {
		var side = this.getChildDirection(item);
		var name = side.charAt(0).toUpperCase() + side.substring(1);
		MM.Layout[name].update(item);
	} else {
		item.getShape().update(item);
		this._layoutRoot(item);
		item.getShape().updateCanvas(item);
	}
}

MM.Layout.FreeMind.getChildDirection = function(item) {
	if (this._left.indexOf(item) > -1) { return "left"; }
	if (this._right.indexOf(item) > -1) { return "right"; }
	
	var top = this._findTopParent(item);
	if (!top.getParent()) debugger;

	if (this._left.indexOf(top) > -1) { 
		this._left.push(item);
		return "left"; 
	}
	if (this._right.indexOf(top) > -1) { 
		this._right.push(item);
		return "right"; 
	}
	
	var rootChildren = top.getParent().getChildren();
	var countLeft = 0, countRight = 0;
	var result = "";
	rootChildren.forEach(function(child) {
		if (this._left.indexOf(child) > -1) {
			countLeft++;
		} else if (this._right.indexOf(child) > -1) {
			countRight++;
		} else {
			var side = "";
			if (countLeft < countRight) {
				side = "left";
				countLeft++;
			} else {
				side = "right";
				countRight++;
			}
			result = side;
			this["_"+side].push(child);
			if (child == top) { this["_"+side].push(item); }
		}
	}, this);
	
	return result;
}

MM.Layout.FreeMind._findTopParent = function(item) {
	var parent = item.getParent();
	while (parent.getParent()) {
		item = parent;
		parent = parent.getParent();
	}
	return item;
}

MM.Layout.FreeMind.pickSibling = function(item, dir) {
	var parent = item.getParent();
	if (!parent) { return item; }

	var children = parent.getChildren();
	if (!parent.getParent()) {
		var side = this.getChildDirection(item);
		children = children.filter(function(child) {
			return (this.getChildDirection(child) == side);
		}, this);
	}
	
	var index = children.indexOf(item);
	index += dir;
	index = (index+children.length) % children.length;
	return children[index];
}

MM.Layout.FreeMind._layoutRoot = function(item) {
	var dom = item.getDOM();
	dom.node.style.position = "absolute";
	dom.children.style.padding = 0;
	dom.children.style.listStyle = "none";
	dom.content.style.position = "relative";

	var children = item.getChildren();
	var childrenLeft = [];
	var childrenRight = [];

	children.forEach(function(child, index) {
		var node = child.getDOM().node;
		var side = this.getChildDirection(child);
		
		if (side == "left") {
			childrenLeft.push(child);
		} else {
			childrenRight.push(child);
		}
	}, this);

	var bboxLeft = this._computeChildrenBBox(childrenLeft, 0, 1);
	var bboxRight = this._computeChildrenBBox(childrenRight, 0, 1);
	var height = Math.max(bboxLeft[1], bboxRight[1], dom.content.offsetHeight);

	var left = 0;
	this._layoutChildren(childrenLeft, "left", 0, 1, [left, Math.round((height-bboxLeft[1])/2)], bboxLeft);
	left += bboxLeft[0];

	if (childrenLeft.length) { left += MM.Layout.SPACING_RANK; }
	dom.content.style.left = left + "px";
	left += dom.content.offsetWidth;

	if (childrenRight.length) { left += MM.Layout.SPACING_RANK; }
	this._layoutChildren(childrenRight, "right", 0, 1, [left, Math.round((height-bboxRight[1])/2)], bboxRight);
	left += bboxRight[0];

	dom.content.style.top = Math.round((height - dom.content.offsetHeight)/2) + "px";
	dom.node.style.height = height + "px";
	dom.node.style.width = left + "px";

	this._anchorCanvas(item);
	this._drawHorizontalConnectors(item, "left", childrenLeft);
	this._drawHorizontalConnectors(item, "right", childrenRight);
}
