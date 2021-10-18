MM.Layout.Graph = Object.create(MM.Layout, {
	SPACING_RANK: {value: 16},
	childDirection: {value: ""}
});

MM.Layout.Graph.getChildDirection = function(child) {
	return this.childDirection;
}

MM.Layout.Graph.create = function(direction, id, label) {
	var layout = Object.create(this, {
		childDirection: {value:direction},
		id: {value:id},
		label: {value:label}
	});
	MM.Layout.ALL.push(layout);
	return layout;
}

MM.Layout.Graph.update = function(item) {
	var side = this.childDirection;
	if (!item.isRoot()) {
		side = item.parent.resolvedLayout.getChildDirection(item);
	}
	this._alignItem(item, side);

	this._layoutItem(item, this.childDirection);

	if (this.childDirection == "left" || this.childDirection == "right") {
		this._drawLinesHorizontal(item, this.childDirection);
	} else {
		this._drawLinesVertical(item, this.childDirection);
	}

	return this;
}


/**
 * Generic graph child layout routine. Updates item's orthogonal size according to the sum of its children.
 */
MM.Layout.Graph._layoutItem = function(item, rankDirection) {
	var rankIndex = (rankDirection == "left" || rankDirection == "right" ? 0 : 1);
	var childIndex = (rankIndex+1) % 2;

	const { contentSize } = item;

	/* children size */
	var bbox = this._computeChildrenBBox(item.children, childIndex);

	/* node size */
	var rankSize = contentSize[rankIndex];
	if (bbox[rankIndex]) { rankSize += bbox[rankIndex] + this.SPACING_RANK; }
	var childSize = Math.max(bbox[childIndex], contentSize[childIndex]);

	let size = [rankSize, childSize];
	if (rankIndex == 1) { size = size.reverse(); }
	item.size = size;

	var offset = [0, 0];
	if (rankDirection == "right") { offset[0] = contentSize[0] + this.SPACING_RANK; }
	if (rankDirection == "bottom") { offset[1] = contentSize[1] + this.SPACING_RANK; }
	offset[childIndex] = Math.round((childSize - bbox[childIndex])/2);
	this._layoutChildren(item.children, rankDirection, offset, bbox);

	/* label position */
	var labelPos = 0;
	if (rankDirection == "left") { labelPos = rankSize - contentSize[0]; }
	if (rankDirection == "top") { labelPos = rankSize - contentSize[1]; }

	let contentPosition = [Math.round((childSize - contentSize[childIndex])/2), labelPos];
	if (rankIndex == 0) { contentPosition = contentPosition.reverse(); }
	item.contentPosition = contentPosition;

	return this;
}

MM.Layout.Graph._layoutChildren = function(children, rankDirection, offset, bbox) {
	var rankIndex = (rankDirection == "left" || rankDirection == "right" ? 0 : 1);
	var childIndex = (rankIndex+1) % 2;

	children.forEach(child => {
		const { size } = child;

		if (rankDirection == "left") { offset[0] = bbox[0] - size[0]; }
		if (rankDirection == "top") { offset[1] = bbox[1] - size[1]; }

		let childPosition = offset.slice(); // could be reversed
		if (rankIndex == 1) { childPosition = childPosition.reverse(); }
		child.position = childPosition;

		offset[childIndex] += size[childIndex] + this.SPACING_CHILD; /* offset for next child */
	});

	return bbox;
}

MM.Layout.Graph._drawLinesHorizontal = function(item, side) {
	this._drawHorizontalConnectors(item, side, item.children);
}

MM.Layout.Graph._drawLinesVertical = function(item, side) {
	this._drawVerticalConnectors(item, side, item.children);
}

MM.Layout.Graph._drawHorizontalConnectors = function(item, side, children) {
	if (children.length == 0) { return; }

	const { contentPosition, contentSize, ctx, resolvedShape } = item;

	ctx.strokeStyle = item.resolvedColor;
	var R = this.SPACING_RANK/2;

	/* first part */
	var y1 = resolvedShape.getVerticalAnchor(item);
	if (side == "left") {
		var x1 = contentPosition[0] - 0.5;
	} else {
		var x1 = contentPosition[0] + contentSize[0] + 0.5;
	}

	this._anchorToggle(item, x1, y1, side);
	if (item.isCollapsed()) { return; }

	if (children.length == 1) {
		var child = children[0];
		const { position } = child;
		var y2 = child.resolvedShape.getVerticalAnchor(child) + position[1];
		var x2 = this._getChildAnchor(child, side);
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.bezierCurveTo((x1+x2)/2, y1, (x1+x2)/2, y2, x2, y2);
		ctx.stroke();
		return;
	}

	if (side == "left") {
		var x2 = x1 - R;
	} else {
		var x2 = x1 + R;
	}

	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y1);
	ctx.stroke();

	/* rounded connectors */
	var c1 = children[0];
	var c2 = children[children.length-1];
 	var x = x2;
 	var xx = x + (side == "left" ? -R : R);

	let p1 = c1.position;
	let p2 = c2.position;

	var y1 = c1.resolvedShape.getVerticalAnchor(c1) + p1[1];
	var y2 = c2.resolvedShape.getVerticalAnchor(c2) + p2[1];
	var x1 = this._getChildAnchor(c1, side);
	var x2 = this._getChildAnchor(c2, side);

	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(xx, y1)
	ctx.arcTo(x, y1, x, y1+R, R);
	ctx.lineTo(x, y2-R);
	ctx.arcTo(x, y2, xx, y2, R);
	ctx.lineTo(x2, y2);

	for (var i=1; i<children.length-1; i++) {
		var c = children[i];
		const { position } = c;
		var y = c.resolvedShape.getVerticalAnchor(c) + position[1];
		ctx.moveTo(x, y);
		ctx.lineTo(this._getChildAnchor(c, side), y);
	}
	ctx.stroke();
}

MM.Layout.Graph._drawVerticalConnectors = function(item, side, children) {
	if (children.length == 0) { return; }

	const { contentSize, size, ctx, resolvedShape } = item;

	ctx.strokeStyle = item.resolvedColor;

	/* first part */
	var R = this.SPACING_RANK/2;

	var x = resolvedShape.getHorizontalAnchor(item);
	var height = (children.length == 1 ? 2*R : R);

	if (side == "top") {
		var y1 = size[1] - contentSize[1];
		var y2 = y1 - height;
		this._anchorToggle(item, x, y1, side);
	} else {
		var y1 = resolvedShape.getVerticalAnchor(item);
		var y2 = contentSize[1] + height;
		this._anchorToggle(item, x, contentSize[1], side);
	}

	ctx.beginPath();
	ctx.moveTo(x, y1);
	ctx.lineTo(x, y2);
	ctx.stroke();


	if (children.length == 1) { return; }

	/* rounded connectors */
	var c1 = children[0];
	var c2 = children[children.length-1];
	var offset = contentSize[1] + height;
	var y = Math.round(side == "top" ? size[1] - offset : offset) + 0.5;

	const p1 = c1.position;
	const p2 = c2.position;

	var x1 = c1.resolvedShape.getHorizontalAnchor(c1) + p1[0];
	var x2 = c2.resolvedShape.getHorizontalAnchor(c2) + p2[0];
	var y1 = this._getChildAnchor(c1, side);
	var y2 = this._getChildAnchor(c2, side);

	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.arcTo(x1, y, x1+R, y, R);
	ctx.lineTo(x2-R, y);
	ctx.arcTo(x2, y, x2, y2, R);

	for (var i=1; i<children.length-1; i++) {
		var c = children[i];
		const { position } = c;
		var x = c.resolvedShape.getHorizontalAnchor(c) + position[0];
		ctx.moveTo(x, y);
		ctx.lineTo(x, this._getChildAnchor(c, side));
	}
	ctx.stroke();
}


MM.Layout.Graph.Down = MM.Layout.Graph.create("bottom", "graph-bottom", "Bottom");
MM.Layout.Graph.Up = MM.Layout.Graph.create("top", "graph-top", "Top");
MM.Layout.Graph.Left = MM.Layout.Graph.create("left", "graph-left", "Left");
MM.Layout.Graph.Right = MM.Layout.Graph.create("right", "graph-right", "Right");
