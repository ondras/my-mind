MM.Item = function(map) {
	this._map = map;
	this._children = [];
	this._parent = null;
	this._layout = null;

	this._oldText = "";

	this._dom = {
		node: document.createElement(this._nodeName),
		content: document.createElement("span"),
		children: document.createElement("ul"),
		canvas: document.createElement("canvas")
	}
	this._dom.node.classList.add("item");
	this._dom.content.classList.add("text");
	this._dom.children.classList.add("children");
	this._dom.node.appendChild(this._dom.canvas);
	this._dom.node.appendChild(this._dom.content);
}
MM.Item.prototype._nodeName = "li";

MM.Item.prototype.update = function() {
	if (!this._map.isVisible()) { return; }
	console.log("updating", this.getText());
	this.getLayout().update(this);
	if (this._parent) { this._parent.update(); }
}

MM.Item.prototype.setText = function(text) {
	this._dom.content.innerHTML = text;
	this.update();
	return this;
}

MM.Item.prototype.getText = function() {
	return this._dom.content.innerHTML;
}

MM.Item.prototype.getChildren = function() {
	return this._children;
}

MM.Item.prototype.getLayout = function() {
	return this._layout || this._parent.getLayout();
}

MM.Item.prototype.setLayout = function(layout) {
	/* FIXME update children */
	this._layout = layout;
	this.update();
	return this;
}

MM.Item.prototype.getDOM = function() {
	return this._dom;
}

MM.Item.prototype.getMap = function() {
	return this._map;
}

MM.Item.prototype.getParent = function() {
	return this._parent;
}

MM.Item.prototype.setParent = function(parent) {
	this._parent = parent;
	return this;
}

MM.Item.prototype.insertChild = function(child, index) {
	if (arguments.length < 2) { index = this._children.length; }
	if (!this._children.length) {
		this._dom.node.appendChild(this._dom.children);
	}

	var newChild = false;
	if (!child) { 
		child = this._map.createItem(); 
		newChild = true;
	}
	
	var next = null;
	if (index < this._children.length) { next = this._children[index].getDOM().node; }
	this._dom.children.insertBefore(child.getDOM().node, next);
	this._children.splice(index, 0, child);
	
	child.setParent(this);

	/* recursively update this child's subtree */
	var func = function(item) {
		var children = item.getChildren();
		if (children.length) {
			children.forEach(func);
		} else {
			item.update();
		}
	}
	func(child); 

	return child;
}

MM.Item.prototype.removeChild = function(child) {
	var index = this._children.indexOf(child);
	this._children.splice(index, 1);
	var node = child.getDOM().node;
	node.parentNode.removeChild(node);
	
	child.setParent(null);
	
	if (!this._children.length) {
		this._dom.children.parentNode.removeChild(this._dom.children);
	}
	
	this.update();
	return child;
}

MM.Item.prototype.startEditing = function() {
	this._oldText = this.getText();
	this._dom.content.contentEditable = true;
	this._dom.content.focus();
	return this;
}

MM.Item.prototype.stopEditing = function() {
	this._dom.content.blur();
	this._dom.content.contentEditable = false;
	var result = this._dom.content.innerHTML;
	this._dom.content.innerHTML = this._oldText;
	this._oldText = "";
	return result;
}
