MM.UI.Notes = function() {
	this._node = document.querySelector("#notes");
}

MM.UI.Notes.prototype.toggle = function() {
	this._node.classList.toggle("visible");
}

MM.UI.Notes.prototype.close = function() {
	if (this._node.classList.contains("visible")) {
		this._node.classList.toggle("visible");
	}
}
