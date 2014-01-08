MM.UI.Layout = function() {
	this._select = document.querySelector("#layout");

	this._select.appendChild(MM.Layout.Map.buildOption());

	var label = this._buildGroup("Graph");
	label.appendChild(MM.Layout.Graph.Right.buildOption());
	label.appendChild(MM.Layout.Graph.Left.buildOption());
	label.appendChild(MM.Layout.Graph.Down.buildOption());
	label.appendChild(MM.Layout.Graph.Up.buildOption());

	var label = this._buildGroup("Tree");
	label.appendChild(MM.Layout.Tree.Right.buildOption());
	label.appendChild(MM.Layout.Tree.Left.buildOption());
	
	this._select.addEventListener("change", this);
}

MM.UI.Layout.prototype.update = function() {
	var value = "";
	var layout = MM.App.current.getOwnLayout();
	if (layout) { value = layout.id; }
	this._select.value = value;
	
	this._getOption("").disabled = MM.App.current.isRoot();
	this._getOption(MM.Layout.Map.id).disabled = !MM.App.current.isRoot();
}

MM.UI.Layout.prototype.handleEvent = function(e) {
	var layout = MM.Layout.getById(this._select.value);

	var action = new MM.Action.SetLayout(MM.App.current, layout);
	MM.App.action(action);
}

MM.UI.Layout.prototype._getOption = function(value) {
	return this._select.querySelector("option[value='" + value + "']");
}

MM.UI.Layout.prototype._buildGroup = function(label) {
	var node = document.createElement("optgroup");
	node.label = label;
	this._select.appendChild(node);
	return node;
}
