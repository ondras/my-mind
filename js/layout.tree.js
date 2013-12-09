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
//	this._drawLines(item, this.childDirection);
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
	var R = this.SPACING_RANK/2;

	/* first part */
	var y1 = item.getShape().getVerticalAnchor(item);
	if (side == "left") {
		var x1 = dom.content.offsetLeft + 0.5;
		var x2 = x1 - width;
	} else {
		var x1 = dom.content.offsetWidth + dom.content.offsetLeft + 0.5;
		var x2 = x1 + width;
	}

	if (children.length == 1) {
		var child = children[0];
		var y2 = child.getShape().getVerticalAnchor(child) + child.getDOM().node.offsetTop;
		var width = 2*R;
	} else {
		var y2 = y1;
		var width = R;
	}

	if (side == "left") {
		var x2 = x1 - width;
	} else {
		var x2 = x1 + width;
	}

	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();

	if (children.length == 1) { return; }

	/* rounded connectors */
	var c1 = children[0];
	var c2 = children[children.length-1];
	var offset = dom.content.offsetWidth + width;
	var x = x2;

	var y1 = c1.getShape().getVerticalAnchor(c1) + c1.getDOM().node.offsetTop;
	var y2 = c2.getShape().getVerticalAnchor(c2) + c2.getDOM().node.offsetTop;
	var x1 = this._getChildAnchor(c1, side);
	var x2 = this._getChildAnchor(c2, side);

	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.arcTo(x, y1, x, y1+R, R);
	ctx.lineTo(x, y2-R);
	ctx.arcTo(x, y2, x2, y2, R);

	for (var i=1; i<children.length-1; i++) {
		var c = children[i];
		var y = c.getShape().getVerticalAnchor(c) + c.getDOM().node.offsetTop;
		ctx.moveTo(x, y);
		ctx.lineTo(this._getChildAnchor(c, side), y);
	}
	ctx.stroke();
}

MM.Layout.Tree.Left = MM.Layout.Tree.create("left");
MM.Layout.Tree.Right = MM.Layout.Tree.create("right");
