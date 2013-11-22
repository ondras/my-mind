MM.Item = function() {
	this._dom = {
		node: document.createElement("li"),
		content: document.createElement("span"),
		children: document.createElement("ul")
	}
	this._children = [];
	this._dom.node.appendChild(this._dom.content);
}

MM.Item.prototype.setText = function(text) {
	this._dom.content.innerHTML = text;
	return this;
}

MM.Item.prototype.getText = function() {
	return this._dom.content.innerHTML;
}

MM.Item.prototype.getNode = function() {
	return this._dom.node;
}

MM.Item.prototype.insertChild = function(index) {
	if (arguments.length == 0) { index = this._children.length; }
	if (!this._children.length) {
		this._dom.node.appendChild(this._dom.children);
	}
	
	var child = new MM.Item();
	var next = null;

	if (index < this._children.length) { next = this._children[index].getNode(); }
	this._dom.children.insertBefore(child.getNode(), next);
	this._children.splice(index, 0, child);
	
	return child;
}

MM.Item.prototype.removeChild = function(child) {
	var index = this._children.indexOf(child);
	this._children.splice(index, 1);
	var node = child.getNode();
	node.parentNode.removeChild(node);
	
	if (!this._children.length) {
		this._dom.children.parentNode.removeChild(this._dom.children);
	}
	
	return child;
}
