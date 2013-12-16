MM.UI.Layout = function() {
	this._select = document.querySelector("#layout");

	this._select.appendChild(MM.Layout.FreeMind.buildOption());

	this._select.appendChild(MM.Layout.Graph.Right.buildOption());
	this._select.appendChild(MM.Layout.Graph.Left.buildOption());
	this._select.appendChild(MM.Layout.Graph.Down.buildOption());
	this._select.appendChild(MM.Layout.Graph.Up.buildOption());

	this._select.appendChild(MM.Layout.Tree.Right.buildOption());
	this._select.appendChild(MM.Layout.Tree.Left.buildOption());
	
	this._select.addEventListener("change", this);
}

MM.UI.Layout.prototype.update = function() {
	var value = "";
	var layout = MM.App.current.getOwnLayout();
	if (layout) { value = layout.id; }
	this._select.value = value;
	
	this._getOption("").disabled = !MM.App.current.getParent();
	this._getOption(MM.Layout.FreeMind.id).disabled = !!MM.App.current.getParent();
}

MM.UI.Layout.prototype.handleEvent = function(e) {
	var layout = MM.Layout.getById(this._select.value);

	var action = new MM.Action.SetLayout(MM.App.current, layout);
	MM.App.action(action);
}

MM.UI.Layout.prototype._getOption = function(value) {
	return this._select.querySelector("option[value='" + value + "']");
}
