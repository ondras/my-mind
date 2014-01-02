MM.Layout.Circle = Object.create(MM.Layout, {
	id: {value:"circle"},
	label: {value:"Circular"}
});
MM.Layout.ALL.push(MM.Layout.Circle);

MM.Layout.Circle.update = function(item) {
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
MM.Layout.Circle.getChildDirection = function(item) {
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

MM.Layout.Circle.pickSibling = function(item, dir) {
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

MM.Layout.Circle._layoutRoot = function(item) {
	var dom = item.getDOM();
	var sides = this._splitRootChildren(item.getChildren());
	var contentSize = [dom.content.offsetWidth, dom.content.offsetHeight];
	var totalSize = [0, 0];
	
	var bboxLeft = this._computeBBox(sides[0]);
	var bboxRight = this._computeBBox(sides[1]);
	totalSize[1] = Math.max(bboxLeft[1], bboxRight[1], contentSize[1]);
	
	this._positionTop(sides[0]
}

MM.Layout.Circle._splitRootChildren = function(children) {
	var children = item.getChildren();
	var childrenHeights = children.map(function(child) {
		return child.getDOM().node.offsetHeight;
	});

	var height = childrenHeights.reduce(function(old, value) {
		return old+value;
	}, 0);
	var half = height/2;
	
	var left = children.slice();
	var right = [];
	
	while (half > 0) {
		right.push(left.shift());
		half -= childrenHeights.shift();
	}
	
	return [left.reverse(), right];
}

/**
 * @param {number} angle 0..Math.PI
 * @returns {number}
 */
MM.Layout.Circle._angleToOffset = function(angle) {
	return 100*Math.sin(angle); /* FIXME */
}
