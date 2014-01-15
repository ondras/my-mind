MM.UI.Status = function() {
	this._select = document.querySelector("#status");
	this._select.addEventListener("change", this);
}

MM.UI.Status.prototype.update = function() {
	this._select.value = MM.App.current.getStatus() || "";
}

MM.UI.Status.prototype.handleEvent = function(e) {
	var action = new MM.Action.SetStatus(MM.App.current, this._select.value || null);
	MM.App.action(action);
}
