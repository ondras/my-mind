MM.Map = function(options) {
	var o = {
		root: "ROOT",
		layout: MM.Layout.FreeMind
	}
	for (var p in options) { o[p] = options[p]; }
	this._root = null;
	this._visible = false;
	this._position = [0, 0];

	var root = this.createItem().setText(o.root).setLayout(o.layout);
	this.setRoot(root);
}

MM.Map.fromJSON = function(data) {
	var map = new this();
	var root = MM.Item.fromJSON(data.root, map);
	map.setRoot(root);
	return map;
}

MM.Map.prototype.toJSON = function() {
	var data = {
		root: this._root.toJSON()
	};
	return data;
}

MM.Map.prototype.createItem = function() {
	return new MM.Item(this);
}

MM.Map.prototype.isVisible = function() {
	return this._visible;
}

MM.Map.prototype.setRoot = function(root) {
	this._root = root;
	return this;
}

MM.Map.prototype.getRoot = function() {
	return this._root;
}

MM.Map.prototype.show = function(where) {
	var node = this._root.getDOM().node;
	where.appendChild(node);
	this._visible = true;
	this._root.updateSubtree();
	this.moveTo(0, 0);
}

MM.Map.prototype.hide = function() {
	var node = this._root.getDOM().node;
	node.parentNode.removeChild(node);
	this._visible = false;
}

MM.Map.prototype.moveTo = function(x, y) {
	this._position = [x, y];

	var node = this._root.getDOM().node;
	var parent = node.parentNode;
	var left = (parent.offsetWidth - node.offsetWidth)/2 + x;
	var top = (parent.offsetHeight - node.offsetHeight)/2 + y;
	node.style.left = Math.round(left) + "px";
	node.style.top = Math.round(top) + "px";

	return this;
}

MM.Map.prototype.moveBy = function(dx, dy) {
	return this.moveTo(this._position[0]+dx, this._position[1]+dy);
}

MM.Map.prototype.getItemFor = function(node) {
	var port = this._root.getDOM().node.parentNode;
	while (node != port && !node.classList.contains("text")) {
		node = node.parentNode;
	}	
	if (node == port) { return null; }

	var scan = function(item, node) {
		if (item.getDOM().content == node) { return item; }
		var children = item.getChildren();
		for (var i=0;i<children.length;i++) {
			var result = scan(children[i], node);
			if (result) { return result; }
		}
		return null;
	}

	return scan(this._root, node);
}

MM.Map.prototype.ensureItemVisibility = function(item) {
	var node = item.getDOM().content;
	var itemRect = node.getBoundingClientRect();
	var root = this._root.getDOM().node;
	var parentRect = root.parentNode.getBoundingClientRect();

	var delta = [0, 0];

	var dx = parentRect.left-itemRect.left;
	if (dx > 0) { delta[0] = dx; }
	var dx = parentRect.right-itemRect.right;
	if (dx < 0) { delta[0] = dx; }

	var dy = parentRect.top-itemRect.top;
	if (dy > 0) { delta[1] = dy; }
	var dy = parentRect.bottom-itemRect.bottom;
	if (dy < 0) { delta[1] = dy; }

	if (delta[0] || delta[1]) {
		this.moveBy(delta[0], delta[1]);
	}
}

MM.Map.prototype.getName = function() {
	var name = this._root.getText();
	/* FIXME tags */
	return name.replace(/\n/g, "");
}
