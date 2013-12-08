MM.UI.Shape = function() {
	this._select = document.querySelector("#shape");
	this._options = {};
	
	this._addItem("", "[automatic]");
	this._addItem("Box", "Box");
	this._addItem("Ellipse", "Ellipse");
	this._addItem("Underline", "Underline");
	
	this._select.addEventListener("change", this);
}

MM.UI.Shape.prototype.update = function() {
	var shape = MM.App.current.getOwnShape();
	var value = "";
	for (var p in MM.Shape) {
		if (MM.Shape[p] == shape) { value = p; }
	}
	this._select.value = value;
}

MM.UI.Shape.prototype.handleEvent = function(e) {
	var shape = MM.Shape[this._select.value] || null;
	MM.App.current.setShape(shape);
}

MM.UI.Shape.prototype._addItem = function(value, label) {
	var option = document.createElement("option");
	option.value = value;
	option.innerHTML = label;
	this._options[value] = option;
	this._select.appendChild(option);
}
