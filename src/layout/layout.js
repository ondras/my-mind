MM.Layout = Object.create(MM.Repo, {
	ALL: {value: []},
	SPACING_RANK: {value: 4},
	SPACING_CHILD: {value: 4},
	childDirection: {value:"right"}
});

MM.Layout.getAll = function() {
	return this.ALL;
}

/**
 * Re-draw an item and its children
 */
MM.Layout.update = function(item) {
}

/**
 * @param {MM.Item} child Child node (its parent uses this layout)
 */
MM.Layout.getChildDirection = function(child) {
	return this.childDirection;
}

MM.Layout.pick = function(item, dir) {
	var opposite = {
		left: "right",
		right: "left",
		top: "bottom",
		bottom: "top"
	}

	/* direction for a child */
	if (!item.isCollapsed()) {
		var children = item.children;
		for (var i=0;i<children.length;i++) {
			var child = children[i];
			if (this.getChildDirection(child) == dir) { return child; }
		}
	}

	if (item.isRoot()) { return item; }

	var parentLayout = item.parent.resolvedLayout;
	var thisChildDirection = parentLayout.getChildDirection(item);
	if (thisChildDirection == dir) {
		return item;
	} else if (thisChildDirection == opposite[dir]) {
		return item.parent;
	} else {
		return parentLayout.pickSibling(item, (dir == "left" || dir == "top" ? -1 : +1));
	}
}

MM.Layout.pickSibling = function(item, dir) {
	if (item.isRoot()) { return item; }

	var children = item.parent.children;
	var index = children.indexOf(item);
	index += dir;
	index = (index+children.length) % children.length;
	return children[index];
}

MM.Layout._anchorToggle = function(item, x, y, side) {
	var node = item.dom.toggle;
	var w = node.offsetWidth;
	var h = node.offsetHeight;
	var l = x;
	var t = y;

	switch (side) {
		case "left":
			t -= h/2;
			l -= w;
		break;

		case "right":
			t -= h/2;
		break;

		case "top":
			l -= w/2;
			t -= h;
		break;

		case "bottom":
			l -= w/2;
		break;
	}

	node.style.left = Math.round(l) + "px";
	node.style.top = Math.round(t) + "px";
}

MM.Layout._getChildAnchor = function(item, side) {
	let { position, contentPosition, contentSize } = item;
	if (side == "left" || side == "right") {
		var pos = position[0] + contentPosition[0];
		if (side == "left") { pos += contentSize[0]; }
	} else {
		var pos = position[1] + contentPosition[1];
		if (side == "top") { pos += contentSize[1]; }
	}
	return pos;
}

MM.Layout._computeChildrenBBox = function(children, childIndex) {
	// FIXME pocita i kdyz jsou skryte
	var bbox = [0, 0];
	var rankIndex = (childIndex+1) % 2;

	children.forEach(child => {
		const { size } = child;

		bbox[rankIndex] = Math.max(bbox[rankIndex], size[rankIndex]); /* adjust cardinal size */
		bbox[childIndex] += size[childIndex]; /* adjust orthogonal size */
	});

	if (children.length > 1) { bbox[childIndex] += this.SPACING_CHILD * (children.length-1); } /* child separation */

	return bbox;
}

MM.Layout.computeAlignment = function(item) {
	let direction = (item.isRoot() ? this.childDirection : item.parent.resolvedLayout.getChildDirection(item));
	if (direction == "left") { return "right"; }
	return "left";
}
