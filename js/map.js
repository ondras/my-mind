MM.Map = function(options) {
	var o = {
		root: "ROOT"
	}
	for (var p in options) { o[p] = options[p]; }

	this._root = new MM.Root(this).setText(o.root);
	this._node = document.createElement("div");
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
	var bbox = [0, 0, 0, 0];
	this._root.updateBBox(bbox);
	var left = (bbox[2]-bbox[0])/2;
	var top = (bbox[3]-bbox[1])/2;

	var avail = [window.innerWidth, window.innerHeight];
	this._node.style.left = Math.round(avail[0]/2 - left) + "px";
	this._node.style.top = Math.round(avail[1]/2 - left) + "px";
}
