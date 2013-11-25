MM.Root = function() {
	MM.Item.call(this);
}
MM.Root.prototype = Object.create(MM.Item.prototype);
MM.Root.prototype._nodeName = "div";

MM.Root.prototype.getSide = function(child) {
	return "right";
}
