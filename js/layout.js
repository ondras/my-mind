MM.Layout = function() {
	this._styles = [];
	this._bbox = [0, 0, 0, 0]; /* l, t, r, b */
}

MM.Layout.prototype.destroy = function() {
	while (this._styles.length) {
		var node = this._styles.pop();
		node.parentNode.removeChild(node);
	}
}

MM.Layout.prototype.getBBox = function() {
	return this._bbox;
}

MM.Layout.prototype.updateItem = function(item) {
	return this;
}

MM.Layout.prototype.pickItem = function(item, direction) {
	return item;
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

MM.Layout.prototype._updateItem = function(item, childDirection) {
	var dom = item.getDOM();

	var oppositeDirection = {
		left: "right",
		right: "left",
		top: "bottom",
		bottom: "top"
	};
	var size = {
		left: "width",
		right: "width",
		top: "height",
		bottom: "height"
	};
	var oppositeSize = {
		width: "height",
		height: "width"
	};
	var position = {
		left: "top",
		right: "top",
		top: "left",
		bottom: "left"
	}
	
	var dir = oppositeDirection[childDirection];
	var pos = position[childDirection];
	var s1 = size[childDirection];
	var s2 = oppositeSize[s1];
	var S1 = s1.charAt(0).toUpperCase() + s1.substring(1);
	var S2 = s2.charAt(0).toUpperCase() + s2.substring(1);

	var total = 0;
	var children = item.getChildren();
	children.forEach(function(child) {
		var node = child.getDOM().node;
		node.style[dir] = dom.content["offset" + S1] + "px";
		node.style[pos] = total+"px";
		total += node["offset" + S2];
	}, this);
	
	var offset = 0;
	if (total) {
		offset = (total - dom.content["offset" + S2])/2;
	}

	dom.content.style[pos] = Math.round(offset) + "px";
	dom.node.style[s2] = Math.max(total, dom.content["offset" + S2]) + "px";
	return this;
}
