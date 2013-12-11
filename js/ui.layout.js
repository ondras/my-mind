MM.UI.Layout = function() {
	this._select = document.querySelector("#layout");
	this._options = {};
	
	this._addItem("[inherit]", "");
	this._addItem("FreeMind", MM.Layout.FreeMind.toJSON());

	var graph = document.createElement("optgroup");
	graph.label = "Graph";
	this._select.appendChild(graph);

	this._addItem("Right", MM.Layout.Graph.Right.toJSON(), graph);
	this._addItem("Left", MM.Layout.Graph.Left.toJSON(), graph);
	this._addItem("Down", MM.Layout.Graph.Down.toJSON(), graph);
	this._addItem("Up", MM.Layout.Graph.Up.toJSON(), graph);
	
	var tree = document.createElement("optgroup");
	tree.label = "Tree";
	this._select.appendChild(tree);

	this._addItem("Right", MM.Layout.Tree.Right.toJSON(), tree);
	this._addItem("Left", MM.Layout.Tree.Left.toJSON(), tree);

	this._select.addEventListener("change", this);
}

MM.UI.Layout.prototype.update = function() {
	var value = "";
	var layout = MM.App.current.getOwnLayout();
	if (layout) { value = layout.toJSON(); }
	this._select.value = value;
	
	this._options[""].disabled = !MM.App.current.getParent();
	this._options[MM.Layout.FreeMind.toJSON()].disabled = !!MM.App.current.getParent();
}

MM.UI.Layout.prototype.handleEvent = function(e) {
	var layout = MM.Layout.fromJSON(this._select.value) || null;
	MM.App.current.setLayout(layout);
}

MM.UI.Layout.prototype._addItem = function(label, value, parent) {
	var option = document.createElement("option");
	option.value = value;
	option.innerHTML = label;
	this._options[value] = option;
	(parent || this._select).appendChild(option);
}
