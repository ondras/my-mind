MM.UI.Color = function() {
	this._select = document.querySelector("#color");
	this._select.addEventListener("change", this);

	var options = this._select.querySelectorAll("option");
	for (var i=0;i<options.length;i++) {
		var option = options[i];
		option.style.backgroundColor = option.value;
	}
}

MM.UI.Color.prototype.update = function() {
	this._select.value = MM.App.current.getOwnColor() || "";
}

MM.UI.Color.prototype.handleEvent = function(e) {
	var action = new MM.Action.SetColor(MM.App.current, this._select.value);
	MM.App.action(action);
}
