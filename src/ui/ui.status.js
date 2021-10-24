import * as actions from "../action.js";
import * as app from "../my-mind.js";


const STATUS_MAP = {
	"yes": true,
	"no": false,
	"": null
}

function statusToString(status) {
	for (let key in STATUS_MAP) {
		if (STATUS_MAP[key] === status) { return key; }
	}
	return status;
}

function stringToStatus(str) {
	return (str in STATUS_MAP ? STATUS_MAP[str] : str);
}

MM.UI.Status = function() {
	this._select = document.querySelector("#status");
	this._select.addEventListener("change", this);
}

MM.UI.Status.prototype.update = function() {
	this._select.value = statusToString(app.currentItem.status);
}

MM.UI.Status.prototype.handleEvent = function(e) {
	let status = stringToStatus(this._select.value);
	var action = actions.SetStatus(app.currentItem, status);
	app.action(action);
}
