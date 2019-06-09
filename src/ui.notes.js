MM.UI.Notes = function() {
	this._node = document.querySelector("#notes");
}

MM.UI.Notes.prototype.toggle = function() {
	this._node.classList.toggle("visible");
}
