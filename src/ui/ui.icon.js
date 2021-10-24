import * as actions from "../action.js";
import * as app from "../my-mind.js";


MM.UI.Icon = function() {
    this._select = document.querySelector("#icons");
    this._select.addEventListener("change", this);
}

MM.UI.Icon.prototype.update = function() {
    this._select.value = app.currentItem.icon || "";
}

MM.UI.Icon.prototype.handleEvent = function(e) {
    var action = new actions.SetIcon(app.currentItem, this._select.value || null);
    app.action(action);
}
