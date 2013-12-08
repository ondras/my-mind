MM.UI.Layout = function() {
	this._select = document.querySelector("#layout");
	this._options = {};
	
	this._addItem("", "[inherit]");
	this._addItem("Plain", "Plain");
	this._addItem("FreeMind", "FreeMind");
	this._addItem("Right", "Tree Right");
	this._addItem("Left", "Tree Left");
	this._addItem("Down", "Tree Down");
	this._addItem("Up", "Tree Up");
	
	this._select.addEventListener("change", this);
}

MM.UI.Layout.prototype.update = function() {
	var layout = MM.App.current.getOwnLayout();
	var value = "";
	for (var p in MM.Layout) {
		if (MM.Layout[p] == layout) { value = p; }
	}
	this._select.value = value;
	
	this._options[""].disabled = !MM.App.current.getParent();
	this._options["FreeMind"].disabled = !!MM.App.current.getParent();
}

MM.UI.Layout.prototype.handleEvent = function(e) {
	var layout = MM.Layout[this._select.value] || null;
	MM.App.current.setLayout(layout);
}

MM.UI.Layout.prototype._addItem = function(value, label) {
	var option = document.createElement("option");
	option.value = value;
	option.innerHTML = label;
	this._options[value] = option;
	this._select.appendChild(option);
}
