MM.Layout.FreeMind = Object.create(MM.Layout.Graph, {
	id: {value:"freemind"},
	label: {value:"FreeMind"}
});
MM.Layout.ALL.push(MM.Layout.FreeMind);

MM.Layout.FreeMind.update = function(item) {
	if (item.getParent()) {
		var side = this.getChildDirection(item);
		var name = side.charAt(0).toUpperCase() + side.substring(1);
		MM.Layout.Graph[name].update(item);
	} else {
		this._layoutRoot(item);
	}
}

/**
 * @param {MM.Item} item Child node
 */
MM.Layout.FreeMind.getChildDirection = function(item) {
	while (item.getParent().getParent()) {
		item = item.getParent();
	}

	/* item is now the sub-root node */
	var side = item.getSide();
	if (side) { return side; } /* FIXME test for left/right values? */

	var counts = {left:0, right:0};
	var children = item.getParent().getChildren();
	for (var i=0;i<children.length;i++) {
		var side = children[i].getSide();
		if (!side) {
			side = (counts.right > counts.left ? "left" : "right");
			children[i].setSide(side);
		}
		counts[side]++;
	}

	return item.getSide();
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

	var bboxLeft = this._computeChildrenBBox(childrenLeft, 1);
	var bboxRight = this._computeChildrenBBox(childrenRight, 1);
	var height = Math.max(bboxLeft[1], bboxRight[1], dom.content.offsetHeight);

	var left = 0;
	this._layoutChildren(childrenLeft, "left", [left, Math.round((height-bboxLeft[1])/2)], bboxLeft);
	left += bboxLeft[0];

	if (childrenLeft.length) { left += this.SPACING_RANK; }
	dom.content.style.left = left + "px";
	left += dom.content.offsetWidth;

	if (childrenRight.length) { left += this.SPACING_RANK; }
	this._layoutChildren(childrenRight, "right", [left, Math.round((height-bboxRight[1])/2)], bboxRight);
	left += bboxRight[0];

	dom.content.style.top = Math.round((height - dom.content.offsetHeight)/2) + "px";
	dom.node.style.height = height + "px";
	dom.node.style.width = left + "px";

	this._anchorCanvas(item);
	this._drawHorizontalConnectors(item, "left", childrenLeft);
	this._drawHorizontalConnectors(item, "right", childrenRight);
}