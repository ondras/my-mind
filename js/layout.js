MM.Layout = function() {
	this._styles = [];
	MM.subscribe("item-change", this);
}

MM.Layout.prototype.destroy = function() {
	while (this._styles.length) {
		var node = this._styles.pop();
		node.parentNode.removeChild(node);
	}
	MM.unsubscribe("item-change", this);
}

MM.Layout.prototype.event = function(event, publisher) {
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

MM.Layout.prototype._getItemHeight = function(item) {
	var contentHeight = item.getDOM().content.offsetHeight;
	var childrenHeight = 0;
	var children = item.getChildren();
	children.forEach(function(child) {
		childrenHeight += this._getItemHeight(child);
	}, this);
	return Math.max(contentHeight, childrenHeight);
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
