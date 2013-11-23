MM.Root = function() {
	this._dom = {
		node: document.createElement("div"),
		content: document.createElement("span"),
		children: {
			left: document.createElement("ul"),
			right: document.createElement("ul")
		}
	}
	this._children = {
		left: [],
		right: []
	}
	
	this._dom.node.appendChild(this._dom.content);
}
MM.Root.prototype = Object.create(MM.Item.prototype);

MM.Root.prototype.getChildren = function(side) {
	return this._children[side];
}

MM.Root.prototype.getParent = function() {
	return null;
}

MM.Root.prototype.getRoot = function() {
	return this;
}

MM.Root.prototype.getSide = function() {
	return null;
}

MM.Root.prototype.insertChild = function(side, child, index) {
	var children = this._children[side];
	var dom = this._dom.children[side];

	if (arguments.length == 2) { index = children.length; }
	if (!children.length) {
		this._dom.node.appendChild(dom);
	}
	
	var next = null;
	if (index < children.length) { next = children[index].getNode(); }
	dom.insertBefore(child.getNode(), next);
	children.splice(index, 0, child);
	
	child.setParent(this);
	return child;
}

MM.Root.prototype.removeChild = function(side, child) {
	var children = this._children[side];
	var dom = this._dom.children[side];
	
	var index = children.indexOf(child);
	children.splice(index, 1);
	var node = child.getNode();
	node.parentNode.removeChild(node);
	
	child.setParent(null);
	
	if (!children.length) {
		this._dom.children.parentNode.removeChild(dom);
	}
	
	return child;
}
