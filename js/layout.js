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

MM.Layout.prototype.positionItem = function(item) {
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
