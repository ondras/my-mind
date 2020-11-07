MM.UI.Notes = function() {
	this._node = document.querySelector("#notes");
}

MM.UI.Notes.prototype.toggle = function() {
	this._node.classList.toggle("visible");
}

MM.UI.Notes.prototype.close = function() {
	if (this._node.classList.contains("visible")) {
		this._node.classList.toggle("visible");
		MM.Clipboard.focus();
	}
}

MM.UI.Notes.prototype.update = function(html) {
	if (html.trim().length === 0) {
		MM.App.current._notes = null;
	} else {
		MM.App.current._notes = html;
	}
	MM.App.current.update();
}
