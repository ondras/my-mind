MM.Map = function() {
	this._root = new MM.Root();
}

MM.Map.prototype.getRoot = function() {
	return this._root;
}

MM.Map.prototype.build = function(where) {
	where.appendChild(this._root.getNode());
}
