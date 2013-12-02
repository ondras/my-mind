MM.Layout = function(options) {
	this._options = {
		spacing: 20,
		underline: 0.9
	};
	for (var p in options) { this._options[p] = options[p]; }
	this._styles = [];
}

MM.Layout.prototype.destroy = function() {
	while (this._styles.length) {
		var node = this._styles.pop();
		node.parentNode.removeChild(node);
	}
}

MM.Layout.prototype.layoutItem = function(item) {
	return this;
}

MM.Layout.prototype.pickItem = function(item, direction) {
	return item;
}

MM.Layout.prototype.getBBox = function(item) {
	return this._addToBBox([0, 0, 0, 0], item);
}

MM.Layout.prototype._addToBBox = function(box, item) {
	var node = item.getDOM().node;
	box[0] = Math.min(box[0], box[0] + node.offsetLeft);
	box[1] = Math.min(box[1], box[1] + node.offsetTop);
	box[2] = Math.max(box[2], box[0] + node.offsetWidth);
	box[3] = Math.max(box[3], box[1] + node.offsetHeight);
	return box;
}

MM.Layout.prototype._addStyle = function(name) {
	var node = document.createElement("link");
	node.rel = "stylesheet";
	node.href = "css/layout/" + name;
	document.head.appendChild(node);
	this._styles.push(node);
}

MM.Layout.prototype._pickParent = function(item) {
	return item.getParent() || item;
}

MM.Layout.prototype._pickChild = function(item) {
	var children = item.getChildren();
	return (children.length ? children[0] : item);
}

MM.Layout.prototype._pickSibling = function(item, dir) {
	var parent = item.getParent();
	if (!parent) { return item; }

	var children = parent.getChildren();
	var index = children.indexOf(item);
	index += dir;
	index = (index+children.length) % children.length;
	return children[index];
}

MM.Layout.prototype._layoutItem = function(item, childDirection) {
	if (childDirection == "left" || childDirection == "right") {
		return this._layoutItemHorizontal(item, childDirection);
	} else {
		return this._layoutItemVertical(item, childDirection);
	}
}

MM.Layout.prototype._layoutItemHorizontal = function(item, childDirection) {
	var oppositeDirection = {
		left: "right",
		right: "left"
	};
	this._layoutItemGeneric(item, oppositeDirection[childDirection], "top", "width", "height");
	this._drawLinesHorizontal(item, oppositeDirection[childDirection]);
}

MM.Layout.prototype._layoutItemVertical = function(item, childDirection) {
	var oppositeDirection = {
		top: "bottom",
		bottom: "top"
	};
	this._layoutItemGeneric(item, oppositeDirection[childDirection], "left", "height", "width");
//	this._drawLinesVertical(item, childDirection);
}


MM.Layout.prototype._layoutItemGeneric = function(item, mainDirection, childDirection, mainSize, childSize) {
	var dom = item.getDOM();
	var mainProp = "offset" + mainSize.charAt(0).toUpperCase() + mainSize.substring(1);
	var childProp = "offset" + childSize.charAt(0).toUpperCase() + childSize.substring(1);

	var total = 0;
	var children = item.getChildren();
	children.forEach(function(child) {
		var node = child.getDOM().node;
		node.style.left = node.style.right = node.style.top = node.style.bottom = "";

		node.style[mainDirection] = (dom.content[mainProp] + this._options.spacing) + "px";
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

MM.Layout.prototype._drawLinesHorizontal = function(item, mainDirection) {
	var dom = item.getDOM();
	var children = item.getChildren();

	var canvas = this._getCanvas(item);

	var width = dom.content.offsetWidth;
	if (children.length) { width += this._options.spacing; }
	canvas.width = width;
	canvas.height = dom.node.offsetHeight;
	canvas.style.left = canvas.style.right = canvas.style.top = canvas.style.bottom = "";
	canvas.style.top = 0;
	canvas.style[mainDirection] = 0;


	var ctx = canvas.getContext("2d");

	/* underline */
	var left = 0;
	var right = canvas.width;
	var top = this._getUnderline(dom.content);

	if (children.length > 1) {
		if (mainDirection == "left") {
			right -= this._options.spacing/2;
		} else {
			left += this._options.spacing/2;
		}
	}

	ctx.beginPath();
	ctx.moveTo(left, top);
	ctx.lineTo(right, top);
	ctx.stroke();

	if (children.length < 2) { return; }

	ctx.beginPath();
	var c1 = children[0].getDOM();
	var c2 = children[children.length-1].getDOM();
	var y1 = this._getUnderline(c1.content) + c1.node.offsetTop;
	var y2 = this._getUnderline(c2.content) + c2.node.offsetTop;

	/* top corner */
	ctx.moveTo(canvas.width, y1);
	ctx.arcTo(canvas.width-this._options.spacing/2, y1, canvas.width-this._options.spacing/2, y1+this._options.spacing/2, this._options.spacing/2);
	ctx.lineTo(canvas.width-this._options.spacing/2, y2-this._options.spacing/2);
	ctx.stroke();
//	ctx.moveTo(canvas.width, )
}

MM.Layout.prototype._drawLinesVertical = function(item) {
}

MM.Layout.prototype._getUnderline = function(node) {
	return Math.round(this._options.underline * node.offsetHeight + node.offsetTop) + 0.5;
}

MM.Layout.prototype._getCanvas = function(item) {
	var dom = item.getDOM();
	var canvas = dom.canvas;
	if (!canvas) {
		var canvas = document.createElement("canvas");
		dom.node.appendChild(canvas);
		dom.canvas = canvas;
	}
	return canvas;
}
