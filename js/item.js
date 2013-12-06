MM.Item = function(map) {
	this._map = map;
	this._parent = null;
	this._children = [];

	this._layout = null;
	this._shape = null;
	this._oldText = "";

	this._dom = {
		node: document.createElement("li"),
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

MM.Item.fromJSON = function(data, map) {
	var item = new this(map);
	item.setText(data.text);
	item.setLayout(MM.Layout.fromJSON(data.layout));
	item.setShape(MM.Shape.fromJSON(data.shape));
	data.children.forEach(function(child) {
		item.insertChild(MM.Item.fromJSON(child, map));
	});
	return item;
}

MM.Item.prototype.toJSON = function() {
	var data = {
		text: this.getText(),
		children: this._children.map(function(child) { return child.toJSON(); }),
		layout: this._layout && this._layout.toJSON(),
		shape: this._shape && this._shape.toJSON()
	};
	return data;
}

MM.Item.prototype.update = function(doNotRecurse) {
	if (!this._map.isVisible()) { return; }
	this.getLayout().update(this);
	if (this._parent && !doNotRecurse) { this._parent.update(); }
}

MM.Item.prototype.updateSubtree = function() {
	this._children.forEach(function(child) {
		child.updateSubtree();
	});
	this.update(true);
}

MM.Item.prototype.setText = function(text) {
	this._dom.content.innerHTML = text.replace(/\n/g, "<br/>");
	this.update();
	return this;
}

MM.Item.prototype.getText = function() {
	return this._dom.content.innerHTML.replace(/<br\/>/g, "\n");
}

MM.Item.prototype.getChildren = function() {
	return this._children;
}

MM.Item.prototype.getLayout = function() {
	return this._layout || this._parent.getLayout();
}

MM.Item.prototype.setLayout = function(layout) {
	this._layout = layout;
	this.updateSubtree();	
	this.update();
	return this;
}

MM.Item.prototype.getShape = function() {
	if (this._shape) { return this._shape; }
	var depth = 0;
	var node = this;
	while (node.getParent()) {
		depth++;
		node = node.getParent();
	}
	switch (depth) {
		case 0: return MM.Shape.Ellipse;
		case 1: return MM.Shape.Box;
		default: return MM.Shape.Underline;
	}
	return this._shape || this._parent.getShape();
}

MM.Item.prototype.setShape = function(shape) {
	this._shape = shape;
	this.updateSubtree();	
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

	child.updateSubtree();
	this.update();

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
