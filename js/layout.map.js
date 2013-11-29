MM.Layout.Map = function() {
	MM.Layout.call(this);
	this._addStyle("reset.css");
	this._addStyle("map.css");
}
MM.Layout.Map.prototype = Object.create(MM.Layout.prototype);

MM.Layout.Map.prototype.pickItem = function(item, direction) {
	switch (direction) {
		case 37: /* left FIXME */
			return this._pickParent(item);
		break;
		case 38: /* top */
			return this._pickSibling(item, -1);
		break;
		case 39: /* right FIXME */
			return this._pickChild(item);
		break;
		case 40: /* down */
			return this._pickSibling(item, +1);
		break;
	}
}

MM.Layout.Map.prototype.positionItem = function(item) {
	var dom = item.getDOM();
	var contentWidth = dom.content.offsetWidth;
	dom.children.style.left = contentWidth + "px";
	
	var height = 0;
	
	var children = item.getChildren();
	children.forEach(function(child) {
		var node = child.getDOM().node;
		node.style.top = height+"px";
		height += node.offsetHeight;
	}, this);
	
	var top = 0;
	if (height) {
		top = (height - dom.content.offsetHeight)/2;
	}
	dom.content.style.top = Math.round(top) + "px";
	dom.node.style.height = Math.max(height, dom.content.offsetHeight) + "px";
	
	return this;
}
