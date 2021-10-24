import * as actions from "../action.js";
import * as app from "../my-mind.js";


MM.UI.Value = function() {
	this._select = document.querySelector("#value");
	this._select.addEventListener("change", this);
}

MM.UI.Value.prototype.update = function() {
	var value = app.currentItem.value;
	if (value === null) { value = ""; }
	if (typeof(value) == "number") { value = "num" }

	this._select.value = value;
}

MM.UI.Value.prototype.handleEvent = function(e) {
	var value = this._select.value;
	if (value == "num") {
		MM.Command.Value.execute();
	} else {
		var action = new actions.SetValue(app.currentItem, value || null);
		app.action(action);
	}
}
