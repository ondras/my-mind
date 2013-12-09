MM.Layout.Tree = Object.create(MM.Layout);
MM.Layout.Tree.SPACING_RANK = 24;
MM.Layout.Tree.childDirection = "";

MM.Layout.Tree.getChildDirection = function(item) {
	return this.childDirection;
}

MM.Layout.Tree.create = function(childDirection) {
	var layout = Object.create(this);
	layout.childDirection = childDirection;
	return layout;
}

MM.Layout.Tree.update = function(item) {
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
	if (bbox[0]) { rankSize = Math.max(rankSize, bbox[0] + this.SPACING_RANK); }
	var childSize = bbox[1] + contentSize[1];
	dom.node.style.width = rankSize + "px";
	dom.node.style.height = childSize + "px";

	var offset = [this.SPACING_RANK, contentSize[1]];
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
	var children = item.getChildren();
	if (children.length == 0) { return; }

	var dom = item.getDOM();
	var canvas = dom.canvas;
	var ctx = canvas.getContext("2d");
	ctx.strokeStyle = MM.LINE_COLOR;

	var R = this.SPACING_RANK/3;
	var x = (side == "left" ? canvas.width - 2*R : 2*R) + 0.5;
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

		ctx.moveTo(x, y - R);
		ctx.arcTo(x, y, this._getChildAnchor(c, side), y, R);
	}
	ctx.stroke();
}

MM.Layout.Tree.Left = MM.Layout.Tree.create("left");
MM.Layout.Tree.Right = MM.Layout.Tree.create("right");
