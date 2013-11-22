MM.Selection = function() {
	this._items = [];
}

MM.Selection.prototype.addItem = function(item) {
	this._items.push(item);
	item.getNode().classList.add("selected");
	return this;
}

MM.Selection.prototype.removeItem = function(item) {
	item.getNode().classList.remove("selected");
	var index = this._items.indexOf(item);
	this._items.splice(index, 1);
	return this;
}

MM.Selection.prototype.clear = function() {
	while (this._items.length) { this.removeItem(this._items[0]); }
	return this;
}

MM.Selection.prototype.getItems = function() {
	return this._items;
}
