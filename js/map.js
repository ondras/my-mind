MM.Map = function() {
	this._root = new MM.Root();
	this._node = document.createElement("div");
	this._node.className = "map";
	this._node.appendChild(this._root.getDOM().node);
}

MM.Map.prototype.getRoot = function() {
	return this._root;
}

MM.Map.prototype.build = function(where) {
	where.appendChild(this._node);
}
