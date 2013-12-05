MM.Map = function(options) {
	var o = {
		root: "ROOT"
	}
	for (var p in options) { o[p] = options[p]; }

	this._root = this.createItem().setText(o.root);
	this._node = document.createElement("ul");
	this._node.className = "map";
	this._node.appendChild(this._root.getDOM().node);

	this._visible = false;
}

MM.Map.prototype.createItem = function() {
	return new MM.Item(this);
}

MM.Map.prototype.isVisible = function() {
	return this._visible;
}

MM.Map.prototype.getRoot = function() {
	return this._root;
}

MM.Map.prototype.show = function(where) {
	where.appendChild(this._node);
	this._visible = true;
}

MM.Map.prototype.hide = function() {
	this._node.parentNode.removeChild(this._node);
	this._visible = false;
}

MM.Map.prototype.center = function() {
	var avail = [window.innerWidth, window.innerHeight];
	var node = this._root.getDOM().node;
	this._node.style.left = Math.round(avail[0]/2 - node.offsetWidth/2) + "px";
	this._node.style.top = Math.round(avail[1]/2 - node.offsetHeight/2) + "px";
}
