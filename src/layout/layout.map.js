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
	while (!child.getParent().isRoot()) {
		child = child.getParent();
	}
	/* child is now the sub-root node */

	var side = child.getSide();
	if (side) { return side; }

	var counts = {left:0, right:0};
	var children = child.getParent().getChildren();
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

	var parent = item.getParent();
	var children = parent.getChildren();
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
	this._drawRootConnectors(item, "left", childrenLeft);
	this._drawRootConnectors(item, "right", childrenRight);
}

MM.Layout.Map._drawRootConnectors = function(item, side, children) {
	if (children.length == 0 || item.isCollapsed()) { return; }

	var dom = item.getDOM();
	var canvas = dom.canvas;
	var ctx = canvas.getContext("2d");
	var R = this.SPACING_RANK/2;

	var x1 = dom.content.offsetLeft + dom.content.offsetWidth/2;
	var y1 = item.getShape().getVerticalAnchor(item);
	var half = this.LINE_THICKNESS/2;

	for (var i=0;i<children.length;i++) {
		var child = children[i];

		var x2 = this._getChildAnchor(child, side);
		var y2 = child.getShape().getVerticalAnchor(child) + child.getDOM().node.offsetTop;
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
