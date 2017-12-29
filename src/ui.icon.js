MM.UI.Icon = function() {
    this._select = document.querySelector("#icons");
    this._select.addEventListener("change", this);
}

MM.UI.Icon.prototype.update = function() {
    this._select.value = MM.App.current.getIcon() || "";
}

MM.UI.Icon.prototype.handleEvent = function(e) {
    var action = new MM.Action.SetIcon(MM.App.current, this._select.value || null);
    MM.App.action(action);
}
