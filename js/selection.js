MM.Selection = function() {
	this._items = [];
}

MM.Selection.prototype.add = function(item) {
	var index = this._items.indexOf(item);
	if (index != -1) { return; }

	this._items.push(item);
	item.getNode().classList.add("selected");
	return this;
}

MM.Selection.prototype.remove = function(item) {
	var index = this._items.indexOf(item);
	if (index == -1) { return; }

	item.getNode().classList.remove("selected");
	this._items.splice(index, 1);
	return this;
}

MM.Selection.prototype.set = function(items) {
	this.clear();
	items.forEach(this.add, this);
}

MM.Selection.prototype.clear = function() {
	while (this._items.length) { this.remove(this._items[0]); }
	return this;
}

MM.Selection.prototype.get = function() {
	return this._items;
}
