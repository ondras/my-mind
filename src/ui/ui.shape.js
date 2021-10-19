import { repo } from "../shape/shape.js";


MM.UI.Shape = function() {
	this._select = document.querySelector("#shape");

	repo.forEach(shape => {
		this._select.append(new Option(shape.label, shape.id));
	});

	this._select.addEventListener("change", this);
}

MM.UI.Shape.prototype.update = function() {
	var value = "";
	var shape = MM.App.current.shape;
	if (shape) { value = shape.id; }

	this._select.value = value;
}

MM.UI.Shape.prototype.handleEvent = function(e) {
	var shape = MM.Shape.getById(this._select.value);

	var action = new MM.Action.SetShape(MM.App.current, shape);
	MM.App.action(action);
}
