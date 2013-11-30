MM.Map = function(options) {
	var o = {
		layout: new MM.Layout.Plain(),
		root: "ROOT"
	}
	for (var p in options) { o[p] = options[p]; }

	this._layout = o.layout;
	this._root = new MM.Root(this).setText(o.root);
	this._node = document.createElement("div");
	this._node.className = "map";
	this._node.appendChild(this._root.getDOM().node);

	this._visible = false;
}

MM.Map.prototype.createItem = function() {
	return new MM.Item(this);
}

MM.Map.prototype.getRoot = function() {
	return this._root;
}

MM.Map.prototype.getLayout = function() {
	return this._layout;
}

MM.Map.prototype.setLayout = function(layout) {
	this._layout = layout;
	/* FIXME */
	return this;
}

MM.Map.prototype.show = function(where) {
	where.appendChild(this._node);
	this._visible = true;
}

MM.Map.prototype.hide = function() {
	this._node.parentNode.removeChild(this._node);
	this._visible = false;
}

/**
 * Item notifies the map about its change
 */
MM.Map.prototype.notify = function(item) {
	if (!this._visible) { return; }

	while (item) {
		this._layout.updateItem(item);
		item = item.getParent();
	}
}
