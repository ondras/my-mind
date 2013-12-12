MM.UI = function() {
	this._node = document.querySelector("#ui");
	this._node.addEventListener("click", this);
	this._layout = new MM.UI.Layout();
	this._shape = new MM.UI.Shape();
}

MM.UI.prototype.handleEvent = function(e) {
	var command = e.target.getAttribute("data-command");
	if (!command) { return; }

	MM.Command[command].execute();
}

MM.UI.prototype.update = function() {
	this._layout.update();
	this._shape.update();
}

MM.UI.prototype.showIO = function(mode) {
	this._io.show(mode);
}

MM.UI.prototype.getWidth = function() {
	return this._node.offsetWidth;
}