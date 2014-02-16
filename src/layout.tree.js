MM.Layout.Tree = Object.create(MM.Layout, {
	SPACING_RANK: {value: 32},
	childDirection: {value: ""}
});

MM.Layout.Tree.getChildDirection = function(child) {
	return this.childDirection;
}

MM.Layout.Tree.create = function(direction, id, label) {
	var layout = Object.create(this, {
		childDirection: {value:direction},
		id: {value:id},
		label: {value:label}
	});
	MM.Layout.ALL.push(layout);
	return layout;
}

MM.Layout.Tree.update = function(item) {
	var side = this.childDirection;
	if (!item.isRoot()) {
		side = item.getParent().getLayout().getChildDirection(item);
	}
	this._alignItem(item, side);

	this._layoutItem(item, this.childDirection);
	this._anchorCanvas(item);
	this._drawLines(item, this.childDirection);
	return this;
}

/**
 * Generic graph child layout routine. Updates item's orthogonal size according to the sum of its children.
 */
MM.Layout.Tree._layoutItem = function(item, rankDirection) {
	var dom = item.getDOM();

	/* content size */
	var contentSize = [dom.content.offsetWidth, dom.content.offsetHeight];

	/* children size */
	var bbox = this._computeChildrenBBox(item.getChildren(), 1);

	/* node size */
	var rankSize = contentSize[0];
	var childSize = bbox[1] + contentSize[1];
	if (bbox[0]) { 
		rankSize = Math.max(rankSize, bbox[0] + this.SPACING_RANK); 
		childSize += this.SPACING_CHILD;
	}
	dom.node.style.width = rankSize + "px";
	dom.node.style.height = childSize + "px";

	var offset = [this.SPACING_RANK, contentSize[1]+this.SPACING_CHILD];
	if (rankDirection == "left") { offset[0] = rankSize - bbox[0] - this.SPACING_RANK; }
	this._layoutChildren(item.getChildren(), rankDirection, offset, bbox);

	/* label position */
	var labelPos = 0;
	if (rankDirection == "left") { labelPos = rankSize - contentSize[0]; }
	dom.content.style.left = labelPos + "px";
	dom.content.style.top = 0;

	return this;
}

MM.Layout.Tree._layoutChildren = function(children, rankDirection, offset, bbox) {
	children.forEach(function(child, index) {
		var node = child.getDOM().node;
		var childSize = [node.offsetWidth, node.offsetHeight];
		var left = offset[0];
		if (rankDirection == "left") { left += (bbox[0] - childSize[0]); }

		node.style.left = left + "px";
		node.style.top = offset[1] + "px";

		offset[1] += childSize[1] + this.SPACING_CHILD; /* offset for next child */
	}, this);

	return bbox;
}

MM.Layout.Tree._drawLines = function(item, side) {
	var dom = item.getDOM();
	var canvas = dom.canvas;

	var R = this.SPACING_RANK/4;
	var x = (side == "left" ? canvas.width - 2*R : 2*R) + 0.5;
	this._anchorToggle(item, x, dom.content.offsetHeight, "bottom");

	var children = item.getChildren();
	if (children.length == 0 || item.isCollapsed()) { return; }

	var ctx = canvas.getContext("2d");
	ctx.strokeStyle = item.getColor();

	var y1 = item.getShape().getVerticalAnchor(item);
	var last = children[children.length-1];
	var y2 = last.getShape().getVerticalAnchor(last) + last.getDOM().node.offsetTop;

	ctx.beginPath();
	ctx.moveTo(x, y1);
	ctx.lineTo(x, y2 - R);

	/* rounded connectors */
	for (var i=0; i<children.length; i++) {
		var c = children[i];
		var y = c.getShape().getVerticalAnchor(c) + c.getDOM().node.offsetTop;
		var anchor = this._getChildAnchor(c, side);

		ctx.moveTo(x, y - R);
		ctx.arcTo(x, y, anchor, y, R);
		ctx.lineTo(anchor, y);
	}
	ctx.stroke();
}

MM.Layout.Tree.Left = MM.Layout.Tree.create("left", "tree-left", "Left");
MM.Layout.Tree.Right = MM.Layout.Tree.create("right", "tree-right", "Right");
