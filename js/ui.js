MM.UI = function() {
	document.querySelector("#button").checked = false;
	this._layout = new MM.UI.Layout();
	this._shape = new MM.UI.Shape();
}

MM.UI.prototype.update = function() {
	this._layout.update();
	this._shape.update();
}
