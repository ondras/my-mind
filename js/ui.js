MM.UI = function() {
	this._node = document.querySelector(".ui");
	this._node.addEventListener("click", this);
	
	this._toggle = document.querySelector("#toggle");
	this._toggle.addEventListener("click", this);

	this._layout = new MM.UI.Layout();
	this._shape = new MM.UI.Shape();
	this._color = new MM.UI.Color();
	this._io = new MM.UI.IO();
	
	MM.subscribe("item-update", this);
	MM.subscribe("item-select", this);

	this._toggleVisibility();
}

MM.UI.prototype.handleMessage = function(message, publisher) {
	switch (message) {
		case "item-select":
			this._update();
		break;

		case "item-update":
			if (publisher == MM.App.current) { this._update(); }
		break;
	}
}

MM.UI.prototype.handleEvent = function(e) {
	/* blur to return focus back to app commands */
	if (e.target.nodeName.toLowerCase() != "select") { e.target.blur(); }

	if (e.target == this._toggle) {
		this._toggleVisibility();
		return;
	}
	
	var command = e.target.getAttribute("data-command");
	if (!command) { return; }

	MM.Command[command].execute();
}

MM.UI.prototype._toggleVisibility = function() {
	this._node.classList.toggle("visible");
	MM.publish("ui-change", this);
}

MM.UI.prototype.showIO = function(mode) {
	this._io.show(mode);
}

MM.UI.prototype.hideIO = function() {
	this._io.hide();
}

MM.UI.prototype.getWidth = function() {
	return (this._node.classList.contains("visible") ? this._node.offsetWidth : 0);
}

MM.UI.prototype._update = function() {
	this._layout.update();
	this._shape.update();
	this._color.update();
}
