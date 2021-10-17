MM.Layout.Map = Object.create(MM.Layout.Graph, {
	id: {value:"map"},
	label: {value:"Map"},
	LINE_THICKNESS: {value:8}
});
MM.Layout.ALL.push(MM.Layout.Map);

MM.Layout.Map.update = function(item) {
	if (item.isRoot()) {
		this._layoutRoot(item);
	} else {
		var side = this.getChildDirection(item);
		var name = side.charAt(0).toUpperCase() + side.substring(1);
		MM.Layout.Graph[name].update(item);
	}
}

/**
 * @param {MM.Item} child Child node
 */
MM.Layout.Map.getChildDirection = function(child) {
	while (!child.parent.isRoot()) {
		child = child.parent;
	}
	/* child is now the sub-root node */

	var side = child.getSide();
	if (side) { return side; }

	var counts = {left:0, right:0};
	var children = child.parent.children;
	for (var i=0;i<children.length;i++) {
		var side = children[i].getSide();
		if (!side) {
			side = (counts.right > counts.left ? "left" : "right");
			children[i].setSide(side);
		}
		counts[side]++;
	}

	return child.getSide();
}

MM.Layout.Map.pickSibling = function(item, dir) {
	if (item.isRoot()) { return item; }

	var parent = item.parent;
	var children = parent.children;
	if (parent.isRoot()) {
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

MM.Layout.Map._layoutRoot = function(item) {
	this._alignItem(item, "right");

	const { children, contentSize } = item;
	var childrenLeft = [];
	var childrenRight = [];
	let contentPosition = [0, 0];

	children.forEach(child => {
		var side = this.getChildDirection(child);

		if (side == "left") {
			childrenLeft.push(child);
		} else {
			childrenRight.push(child);
		}
	});

	var bboxLeft = this._computeChildrenBBox(childrenLeft, 1);
	var bboxRight = this._computeChildrenBBox(childrenRight, 1);
	var height = Math.max(bboxLeft[1], bboxRight[1], contentSize[1]);

	var left = 0;
	this._layoutChildren(childrenLeft, "left", [left, Math.round((height-bboxLeft[1])/2)], bboxLeft);
	left += bboxLeft[0];

	if (childrenLeft.length) { left += this.SPACING_RANK; }
	contentPosition[0] = left;
	left += contentSize[1];

	if (childrenRight.length) { left += this.SPACING_RANK; }
	this._layoutChildren(childrenRight, "right", [left, Math.round((height-bboxRight[1])/2)], bboxRight);
	left += bboxRight[0];

	contentPosition[1] = Math.round((height - contentSize[1])/2);
	item.contentPosition = contentPosition;

	item.size = [left, height];
	this._drawRootConnectors(item, "left", childrenLeft);
	this._drawRootConnectors(item, "right", childrenRight);
}

MM.Layout.Map._drawRootConnectors = function(item, side, children) {
	if (children.length == 0 || item.isCollapsed()) { return; }

	const { contentSize, contentPosition, ctx } = item;

	var x1 = contentPosition[0] + contentSize[0]/2;
	var y1 = item.getShape().getVerticalAnchor(item);
	var half = this.LINE_THICKNESS/2;

	for (var i=0;i<children.length;i++) {
		var child = children[i];

		var x2 = this._getChildAnchor(child, side);
		var y2 = child.getShape().getVerticalAnchor(child) + child.position[1];
		var angle = Math.atan2(y2-y1, x2-x1) + Math.PI/2;
		var dx = Math.cos(angle) * half;
		var dy = Math.sin(angle) * half;

		ctx.fillStyle = ctx.strokeStyle = child.getColor();
		ctx.beginPath();
		ctx.moveTo(x1-dx, y1-dy);
		ctx.quadraticCurveTo((x2+x1)/2, y2, x2, y2);
		ctx.quadraticCurveTo((x2+x1)/2, y2, x1+dx, y1+dy);
		ctx.fill();
		ctx.stroke();
	}

}
