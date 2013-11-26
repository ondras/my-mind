MM.Root = function() {
	MM.Item.call(this);
	this._dom.content.classList.add("root");
}
MM.Root.prototype = Object.create(MM.Item.prototype);
MM.Root.prototype._nodeName = "div";
