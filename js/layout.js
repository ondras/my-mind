MM.Layout = {
	SPACING: 16,
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
MM.Layout._layoutItem = function(item, mainDirection, childDirection, mainSize, childSize) {
	var dom = item.getDOM();
	var mainProp = "offset" + mainSize.charAt(0).toUpperCase() + mainSize.substring(1);
	var childProp = "offset" + childSize.charAt(0).toUpperCase() + childSize.substring(1);

	var total = 0;
	var children = item.getChildren();
	children.forEach(function(child) {
		var node = child.getDOM().node;
		node.style.left = node.style.right = node.style.top = node.style.bottom = "";

		node.style[mainDirection] = (dom.content[mainProp] + MM.Layout.SPACING) + "px";
		node.style[childDirection] = total+"px";

		total += node[childProp];
	}, this);

	var offset = 0;
	if (total) {
		offset = (total - dom.content[childProp])/2;
	}

	dom.content.style[childDirection] = Math.round(offset) + "px";
	dom.node.style[childSize] = Math.max(total, dom.content[childProp]) + "px";

	return this;
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
