MM.Item = function(map) {
	this._map = map;
	this._parent = null;
	this._children = [];

	this._layout = null;
	this._shape = null;
	this._autoShape = true;
	this._color = null;
	this._side = null; /* side preference */
	this._id = MM.generateId();
	this._oldText = "";

	this._dom = {
		node: document.createElement("li"),
		content: document.createElement("div"),
		children: document.createElement("ul"),
		canvas: document.createElement("canvas")
	}
	this._dom.node.classList.add("item");
	this._dom.content.classList.add("text");
	this._dom.children.classList.add("children");
	this._dom.node.appendChild(this._dom.canvas);
	this._dom.node.appendChild(this._dom.content);
}

MM.Item.COLOR = "#999";

MM.Item.fromJSON = function(data, map) {
	/* FIXME potrebujeme tovarnu? */
	return new this(map).fromJSON(data);
}

MM.Item.prototype.fromJSON = function(data) {
	/* FIXME bez setteru, testovat pritomnost? */
	this.setText(data.text);
	this.setSide(data.side || null);
	this.setColor(data.color || null);
	this.setLayout(MM.Layout.getById(data.layout));
	this.setShape(MM.Shape.getById(data.shape));
	(data.children || []).forEach(function(child) {
		this.insertChild(MM.Item.fromJSON(child, this._map));
	}, this);
	return this;
}

MM.Item.prototype.toJSON = function() {
	var data = {
		text: this.getText()
	}
	
	if (this._side) { data.side = this._side; }
	if (this._color) { data.color = this._color; }
	if (this._layout) { data.layout = this._layout.id; }
	if (!this._autoShape) { data.shape = this._shape.id; }
	if (this._children.length) {
		data.children = this._children.map(function(child) { return child.toJSON(); });
	}

	return data;
}

MM.Item.prototype.update = function(doNotRecurse) {
	MM.publish("item-change", this);
	if (!this._map.isVisible()) { return; }

	if (this._autoShape) { /* check for changed auto-shape */
		var autoShape = this._getAutoShape();
		if (autoShape != this._shape) {
			if (this._shape) { this._shape.unset(this); }
			this._shape = autoShape;
			this._shape.set(this);
		}
	}

	this.getLayout().update(this);
	this.getShape().update(this);
	if (this._parent && !doNotRecurse) { this._parent.update(); }
}

MM.Item.prototype.updateSubtree = function(isSubChild) {
	this._children.forEach(function(child) {
		child.updateSubtree(true);
	});
	this.update(isSubChild);
}

MM.Item.prototype.setText = function(text) {
	this._dom.content.innerHTML = text.replace(/\n/g, "<br/>");
	this.update();
	return this;
}

MM.Item.prototype.getText = function() {
	return this._dom.content.innerHTML.replace(/<br\s*\/?>/g, "\n");
}

MM.Item.prototype.setSide = function(side) {
	this._side = side;
	return this;
}

MM.Item.prototype.getSide = function() {
	return this._side;
}

MM.Item.prototype.getChildren = function() {
	return this._children;
}

MM.Item.prototype.setColor = function(color) {
	this._color = color;
	this.updateSubtree();
	return this;
}

MM.Item.prototype.getColor = function() {
	return this._color || (this._parent ? this._parent.getColor() : MM.Item.COLOR);
}

MM.Item.prototype.getOwnColor = function() {
	return this._color;
}

MM.Item.prototype.getLayout = function() {
	return this._layout || this._parent.getLayout();
}

MM.Item.prototype.getOwnLayout = function() {
	return this._layout;
}

MM.Item.prototype.setLayout = function(layout) {
	this._layout = layout;
	this.updateSubtree();	
	return this;
}

MM.Item.prototype.getShape = function() {
	return this._shape;

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
}

MM.Item.prototype.getOwnShape = function() {
	return (this._autoShape ? null : this._shape);
}

MM.Item.prototype.setShape = function(shape) {
	if (this._shape) { this._shape.unset(this); }

	if (shape) {
		this._autoShape = false;
		this._shape = shape;
	} else {
		this._autoShape = true;
		this._shape = this._getAutoShape();
	}

	this._shape.set(this);
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
	document.execCommand("styleWithCSS", null, false);
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

MM.Item.prototype._getAutoShape = function() {
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
}
