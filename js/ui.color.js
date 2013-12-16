MM.UI.Color = function() {
	this._select = document.querySelector("#color");
	this._select.addEventListener("change", this);
}

MM.UI.Color.prototype.update = function() {
	this._select.value = MM.App.current.getOwnColor() || "";
}

MM.UI.Color.prototype.handleEvent = function(e) {
	var action = new MM.Action.SetColor(MM.App.current, this._select.value);
	MM.App.action(action);
}
