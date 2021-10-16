MM.UI = function() {
	this._node = document.querySelector(".ui");
	
	this._toggle = this._node.querySelector("#toggle");

	this._layout = new MM.UI.Layout();
	this._shape = new MM.UI.Shape();
	this._icon = new MM.UI.Icon();
	this._color = new MM.UI.Color();
	this._value = new MM.UI.Value();
	this._status = new MM.UI.Status();
		
	MM.subscribe("item-select", this);
	MM.subscribe("item-change", this);

	this._node.addEventListener("click", this);
	this._node.addEventListener("change", this);

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
	switch (e.type) {
		case "click":
			if (e.target.nodeName.toLowerCase() != "select") { MM.Clipboard.focus(); } /* focus the clipboard (2c) */

			if (e.target == this._toggle) {
				this.toggle();
				return;
			}
			
			var node = e.target;
			while (node != document) {
				var command = node.getAttribute("data-command");
				if (command) {
					MM.Command[command].execute();
					return;
				}
				node = node.parentNode;
			}
		break;

		case "change":
			MM.Clipboard.focus(); /* focus the clipboard (2c) */
		break;
	}
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
	this._icon.update();
	this._value.update();
	this._status.update();
}
