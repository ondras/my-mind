MM.Layout.Map = function() {
	MM.Layout.call(this);
	this._addStyle("reset.css");
	this._addStyle("map.css");
}
MM.Layout.Map.prototype = Object.create(MM.Layout.prototype);

MM.Layout.Map.prototype.event = function(event, publisher) {
	this._updateItem(publisher);
}

MM.Layout.Map.prototype._updateItem = function(item) {
	var dom = item.getDOM();
	var contentWidth = dom.content.offsetWidth;
	dom.children.style.left = contentWidth + "px";
	
	var height = 0;
	
	var children = item.getChildren();
	children.forEach(function(child) {
		child.getDOM().node.style.top = height+"px";
		height += this._getItemHeight(child);
	}, this);
	
	var top = 0;
	if (height) {
		top = (height - dom.content.offsetHeight)/2;
	}
	dom.content.style.top = Math.round(top) + "px";
	
	var parent = item.getParent();
	if (parent) { this._updateItem(parent); }
}
