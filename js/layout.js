MM.Layout = {
	SPACING_RANK: 16,
	SPACING_CHILD: 4,
	UNDERLINE: 0.85,
	LINE_COLOR: "#aaa"
};

/**
 * Re-draw an item and its children
 */
MM.Layout.update = function(item) {
	return this;
}

MM.Layout.pick = function(item, direction) {
	/* FIXME upravit. pick patri do uzlu, ktery konzultuje svuj layout a layout nadrizeneho */
	return item;
}

MM.Layout._pickParent = function(item) {
	return item.getParent() || item;
}

MM.Layout._pickChild = function(item) {
	var children = item.getChildren();
	return (children.length ? children[0] : item);
}

MM.Layout._pickSibling = function(item, dir) {
	var parent = item.getParent();
	if (!parent) { return item; }

	var children = parent.getChildren();
	var index = children.indexOf(item);
	index += dir;
	index = (index+children.length) % children.length;
	return children[index];
}

/**
 * Generic child layout routine. Updates item's orthogonal size according to the sum of its children.
 */
MM.Layout._layoutItem = function(item, rankDirection) {
	var sizeProps = ["width", "height"];
	var posProps = ["left", "top"];
	var rankIndex = (rankDirection == "left" || rankDirection == "right" ? 0 : 1);
	var childIndex = (rankIndex+1) % 2;

	var rankPosProp = posProps[rankIndex];
	var childPosProp = posProps[childIndex];
	var rankSizeProp = sizeProps[rankIndex];
	var childSizeProp = sizeProps[childIndex];

	var bbox = this._computeChildrenBBox(item, rankIndex, childIndex);

	var dom = item.getDOM();
	var contentSize = [dom.content.offsetWidth, dom.content.offsetHeight];

	var offset = [0, 0];
	if (rankDirection == "right") { offset[0] = contentSize[0] + MM.Layout.SPACING_RANK; }
	if (rankDirection == "bottom") { offset[1] = contentSize[1] + MM.Layout.SPACING_RANK; }

	/* position children */
	item.getChildren().forEach(function(child, index) {
		var node = child.getDOM().node;
		var childSize = [node.offsetWidth, node.offsetHeight];

		if (rankDirection == "left") { offset[0] = bbox[0] - childSize[0]; }
		if (rankDirection == "top") { offset[1] = bbox[1] - childSize[1]; }

		node.style[childPosProp] = offset[childIndex] + "px";
		node.style[rankPosProp] = offset[rankIndex] + "px";

		offset[childIndex] += childSize[childIndex] + MM.Layout.SPACING_CHILD; /* offset for next child */
	}, this);

	var rankSize = contentSize[rankIndex];
	if (bbox[rankIndex]) { rankSize += bbox[rankIndex] + MM.Layout.SPACING_RANK; }
	var childSize = Math.max(bbox[childIndex], contentSize[childIndex]);

	/* node size */
	dom.node.style[rankSizeProp] = rankSize + "px";
	dom.node.style[childSizeProp] = childSize + "px";

	/* label position */
	var labelPos = 0;
	if (rankDirection == "left") { labelPos = rankSize - contentSize[0]; }
	if (rankDirection == "top") { labelPos = rankSize - contentSize[1]; }
	dom.content.style[childPosProp] = Math.round((childSize - contentSize[childIndex])/2) + "px";
	dom.content.style[rankPosProp] = labelPos + "px";

	return this;
}

MM.Layout._computeChildrenBBox = function(item, rankIndex, childIndex) {
	var bbox = [0, 0];
	var children = item.getChildren();

	children.forEach(function(child, index) {
		var node = child.getDOM().node;
		var childSize = [node.offsetWidth, node.offsetHeight];

		bbox[rankIndex] = Math.max(bbox[rankIndex], childSize[rankIndex]); /* adjust cardinal size */
		bbox[childIndex] += childSize[childIndex]; /* adjust orthogonal size */
	}, this);

	if (children.length > 1) { bbox[childIndex] += MM.Layout.SPACING_CHILD * (children.length-1); } /* child separation */

	return bbox;
}

MM.Layout._drawLinesHorizontal = function(item, anchor) {
	this._anchorCanvas(item, anchor);
	this._drawHorizontalConnectors(item, anchor == "left" ? "right" : "left", item.getChildren());
}

MM.Layout._drawLinesVertical = function(item, anchor) {
	this._anchorCanvas(item, anchor);
	this._drawVerticalConnectors(item, anchor == "top" ? "bottom" : "top", item.getChildren());
}

MM.Layout._drawHorizontalConnectors = function(item, side, children) {
	if (children.length == 0) { return; }

	var dom = item.getDOM();
	var canvas = dom.canvas;
	var ctx = canvas.getContext("2d");
	ctx.strokeStyle = MM.Layout.LINE_COLOR;

	/* first part */
	var R = MM.Layout.SPACING/2;
	var width = (children.length == 1 ? 2*R : R);
	var top = this._getUnderline(dom.content);

	if (side == "left") {
		var left = (children.length == 1 ? 0 : width);
		var right = left + width;
	} else {
		var right = canvas.width - (children.length == 1 ? 0 : width);
		var left = right - width;
	}

	ctx.beginPath();
	ctx.moveTo(left, top);
	ctx.lineTo(right, top);
	ctx.stroke();

	if (children.length == 1) { return; }

	/* rounded connectors */
	var c1 = children[0].getDOM();
	var c2 = children[children.length-1].getDOM();
	var y1 = this._getUnderline(c1.content) + c1.node.offsetTop;
	var y2 = this._getUnderline(c2.content) + c2.node.offsetTop;
	var x = Math.round(side == "left" ? R : canvas.width-R) + 0.5;
	var edge = (side == "right" ? canvas.width : 0);

	ctx.beginPath();
	ctx.moveTo(edge, y1);
	ctx.arcTo(x, y1, x, y1+R, R);
	ctx.lineTo(x, y2-R);
	ctx.arcTo(x, y2, edge, y2, R);

	for (var i=1; i<children.length-1; i++) {
		var c = children[i].getDOM();
		var y = this._getUnderline(c.content) + c.node.offsetTop;
		ctx.moveTo(x, y);
		ctx.lineTo(edge, y);
	}
	ctx.stroke();
}

MM.Layout._drawVerticalConnectors = function(item, side, children) {
	if (children.length == 0) { return; }

	var dom = item.getDOM();
	var canvas = dom.canvas;
	var ctx = canvas.getContext("2d");
	ctx.strokeStyle = MM.Layout.LINE_COLOR;

	/* first part */
	var R = MM.Layout.SPACING/2;

	var left = this._getCenterline(dom.content);

	if (side == "top") {
		var top = (children.length == 1 ? 0 : R);
		var bottom = top + (children.length == 1 ? 2*R : R);
	} else {
		var top = this._getUnderline(dom.content);
		var bottom = canvas.height - (children.length == 1 ? 0 : R);
	}

	ctx.beginPath();
	ctx.moveTo(left, top);
	ctx.lineTo(left, bottom);
	ctx.stroke();

	if (children.length == 1) { return; }

	/* rounded connectors */
	var c1 = children[0].getDOM();
	var c2 = children[children.length-1].getDOM();
	var x1 = this._getCenterline(c1.content) + c1.node.offsetLeft;
	var x2 = this._getCenterline(c2.content) + c2.node.offsetLeft;
	var y = Math.round(side == "top" ? R : canvas.height-R) + 0.5;
	var edge = (side == "bottom" ? canvas.height : 0);

	ctx.beginPath();
	ctx.moveTo(x1, edge);
	ctx.arcTo(x1, y, x1+R, y, R);
	ctx.lineTo(x2-R, y);
	ctx.arcTo(x2, y, x2, edge, R);

	for (var i=1; i<children.length-1; i++) {
		var c = children[i].getDOM();
		var x = this._getCenterline(c.content) + c.node.offsetLeft;
		ctx.moveTo(x, y);
		ctx.lineTo(x, edge);
	}
	ctx.stroke();
}

/**
 * Adjust canvas size and position w.r.t an item. Draw underline.
 */
MM.Layout._anchorCanvas = function(item, anchor) {
	var dom = item.getDOM();
	var canvas = dom.canvas;
	var children = item.getChildren().length;

	canvas.style.left = canvas.style.right = canvas.style.top = canvas.style.bottom = "";
	var width = dom.content.offsetWidth;
	var height = dom.content.offsetHeight;

	if (anchor == "left" || anchor == "right") {
		canvas.width = dom.content.offsetWidth + (children ? MM.Layout.SPACING : 0);
		canvas.height = dom.node.offsetHeight;
		canvas.style.top = 0;
		canvas.style[anchor] = 0;
	} else {
		canvas.width = dom.node.offsetWidth;
		canvas.height = dom.content.offsetHeight + (children ? MM.Layout.SPACING : 0);
		canvas.style.left = 0;
		canvas.style[anchor] = 0;
	}

	/* underline */
	var ctx = canvas.getContext("2d");
	ctx.strokeStyle = MM.Layout.LINE_COLOR;

	var left = dom.content.offsetLeft;
	if (anchor == "right" && children) { left += MM.Layout.SPACING; }

	var right = left + dom.content.offsetWidth;

	var top = this._getUnderline(dom.content);
	if (anchor == "bottom" && children) { top += MM.Layout.SPACING; }

	ctx.beginPath();
	ctx.moveTo(left, top);
	ctx.lineTo(right, top);
	ctx.stroke();
}

MM.Layout._getUnderline = function(node) {
	return Math.round(MM.Layout.UNDERLINE * node.offsetHeight + node.offsetTop) + 0.5;
}

MM.Layout._getCenterline = function(node) {
	return Math.round(node.offsetLeft + node.offsetWidth/2) + 0.5;
}

MM.Layout._reset = function(item) {
	var dom = item.getDOM();
	dom.node.style.position = "absolute";
	dom.content.style.position = "relative";

	dom.node.style.margin = dom.children.style.margin = 0;
	dom.node.style.padding = dom.children.style.padding = 0;
	dom.node.style.listStyle = "none";
}
