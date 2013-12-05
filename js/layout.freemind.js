MM.Layout.FreeMind = Object.create(MM.Layout);
MM.Layout.FreeMind.UNDERLINE = 0.5;

MM.Layout.FreeMind.getUnderline = function(item) {
	if (item.getParent()) { return MM.Layout.getUnderline(item); }
	return MM.Layout.getUnderline.call(this, item);
}

MM.Layout.FreeMind.update = function(item) {
	if (item.getParent()) {
		var side = this.getChildDirection(item);
		var name = side.charAt(0).toUpperCase() + side.substring(1);
		MM.Layout[name].update(item);
	} else {
		this._layoutRoot(item);
	}
}

MM.Layout.FreeMind.getChildDirection = function(item) {
	while (item.getParent().getParent()) {
		item = item.getParent();
	}
	var children = item.getParent().getChildren();
	var index = children.indexOf(item);
	return (index % 2 ? "left" : "right");
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
	dom.node.style.margin = dom.children.style.margin = 0;
	dom.node.style.padding = dom.children.style.padding = 0;
	dom.node.style.listStyle = "none";
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
	this._layoutChildren(childrenLeft, "left", 0, 1, [left, Math.round((height-bboxLeft[1])/2)]);
	left += bboxLeft[0];

	if (childrenLeft.length) { left += MM.Layout.SPACING_RANK; }
	dom.content.style.left = left + "px";
	left += dom.content.offsetWidth;

	if (childrenRight.length) { left += MM.Layout.SPACING_RANK; }
	this._layoutChildren(childrenRight, "right", 0, 1, [left, Math.round((height-bboxRight[1])/2)]);
	left += bboxRight[0];

	dom.content.style.top = Math.round((height - dom.content.offsetHeight)/2) + "px";
	dom.node.style.height = height + "px";
	dom.node.style.width = left + "px";

	this._anchorCanvas(item);
	this._drawHorizontalConnectors(item, "left", childrenLeft);
	this._drawHorizontalConnectors(item, "right", childrenRight);
}
