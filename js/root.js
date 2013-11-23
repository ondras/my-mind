MM.Root = function() {
	MM.Item.call(this);
	
	var old = this._dom.node;
	this._dom.node = document.createElement("div");
	while (old.firstChild) { this._dom.node.appendChild(old.firstChild); }
	
	this._left = this.insertNewChild();
	this._right = this.insertNewChild();
}
MM.Root.prototype = Object.create(MM.Item.prototype);

MM.Root.prototype.getLeft = function() {
	return this._left;
}

MM.Root.prototype.getRight = function() {
	return this._right;
}
