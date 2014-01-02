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
	var sides = this._splitRootChildren(item.getChildren());
	
	this._layoutChildren(item, right, 0, Math.PI);
	this._layoutChildren(item, left, Math.PI, 2*Math.PI);
	
	console.log(left);
	console.log(right);
	
	return;
	
	var dom = item.getDOM();

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
	this._drawHorizontalConnectors(item, "left", childrenLeft);
	this._drawHorizontalConnectors(item, "right", childrenRight);
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
	
	return 
}
