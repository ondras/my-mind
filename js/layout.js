MM.Layout = function() {
	this._styles = [];
	MM.subscribe("item-change", this);
}

MM.Layout.prototype.destroy = function() {
	while (this._styles.length) {
		var node = this._styles.pop();
		node.parentNode.removeChild(node);
	}
	MM.unsubscribe("item-change", this);
}

MM.Layout.prototype.event = function(event, publisher) {
}

MM.Layout.prototype._addStyle = function(name) {
	var node = document.createElement("link");
	node.rel = "stylesheet";
	node.href = "css/layout/" + name;
	document.head.appendChild(node);
	this._styles.push(node);
}
