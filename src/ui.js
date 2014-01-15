MM.UI = function() {
	this._node = document.querySelector(".ui");
	this._node.addEventListener("click", this);
	
	this._toggle = document.querySelector("#toggle");
	this._toggle.addEventListener("click", this);

	this._layout = new MM.UI.Layout();
	this._shape = new MM.UI.Shape();
	this._color = new MM.UI.Color();
	this._value = new MM.UI.Value();
	this._status = new MM.UI.Status();
		
	MM.subscribe("item-change", this);
	MM.subscribe("item-select", this);

	this.toggle();
}

MM.UI.prototype.handleMessage = function(message, publisher) {
	switch (message) {
		case "item-select":
			this._update();
		break;

		case "item-change":
			if (publisher == MM.App.current) { this._update(); }
		break;
	}
}

MM.UI.prototype.handleEvent = function(e) {
	/* blur to return focus back to app commands */
	if (e.target.nodeName.toLowerCase() != "select") { e.target.blur(); }

	if (e.target == this._toggle) {
		this.toggle();
		return;
	}
	
	var command = e.target.getAttribute("data-command");
	if (!command) { return; }

	MM.Command[command].execute();
}

MM.UI.prototype.toggle = function() {
	this._node.classList.toggle("visible");
	MM.publish("ui-change", this);
}


MM.UI.prototype.getWidth = function() {
	return (this._node.classList.contains("visible") ? this._node.offsetWidth : 0);
}

MM.UI.prototype._update = function() {
	this._layout.update();
	this._shape.update();
	this._value.update();
	this._status.update();
}
