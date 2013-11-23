MM.Item = function(parent) {
	this._dom = {
		node: document.createElement("li"),
		content: document.createElement("span"),
		children: document.createElement("ul")
	}
	this._children = [];
	this._parent = parent;
	this._dom.node.appendChild(this._dom.content);
	
	this._oldText = "";
}

MM.Item.prototype.setText = function(text) {
	this._dom.content.innerHTML = text;
	return this;
}

MM.Item.prototype.getText = function() {
	return this._dom.content.innerHTML;
}

MM.Item.prototype.getChildren = function() {
	return this._children;
}

MM.Item.prototype.getNode = function() {
	return this._dom.node;
}

MM.Item.prototype.getParent = function() {
	return this._parent;
}

MM.Item.prototype.setParent = function(this) {
	this._parent = parent;
	return this;
}

MM.Item.prototype.insertChild = function(child, index) {
	if (arguments.length == 1) { index = this._children.length; }
	if (!this._children.length) {
		this._dom.node.appendChild(this._dom.children);
	}
	
	var next = null;
	if (index < this._children.length) { next = this._children[index].getNode(); }
	this._dom.children.insertBefore(child.getNode(), next);
	this._children.splice(index, 0, child);
	
	child.setParent(this);
	return child;
}

MM.Item.prototype.insertNewChild = function(index) {
	return this.insertChild(new MM.Item(), index);
}

MM.Item.prototype.removeChild = function(child) {
	var index = this._children.indexOf(child);
	this._children.splice(index, 1);
	var node = child.getNode();
	node.parentNode.removeChild(node);
	
	child.setParent(null);
	
	if (!this._children.length) {
		this._dom.children.parentNode.removeChild(this._dom.children);
	}
	
	return child;
}

MM.Item.prototype.startEditing = function() {
	this._oldText = this.getText();
	this._dom.content.contentEditable = true;
	return this;
}

MM.Item.prototype.stopEditing = function(save) {
	this._dom.content.contentEditable = false;
	
	if (save) {
		var action = new WM.Action.SetText(this, this.getText());
		this._oldText = "";
		return action;
	} else {
		this.setText(this._oldText);		
		this._oldText = "";
		return this;
	}
}
