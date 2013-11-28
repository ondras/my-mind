MM.Root = function(map) {
	MM.Item.call(this, map);
	this._dom.content.classList.add("root");
}
MM.Root.prototype = Object.create(MM.Item.prototype);
MM.Root.prototype._nodeName = "div";
