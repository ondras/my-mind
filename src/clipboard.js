MM.Clipboard = {
	_data: null,
	_mode: "",
	_node: document.createElement("textarea")
};

MM.Clipboard.init = function() {
	this._node.style.position = "absolute";
	this._node.style.width = 0;
	this._node.style.height = 0;
	this._node.style.left = "-100px";
	this._node.style.top = "-100px";
	document.body.appendChild(this._node);
}

MM.Clipboard.focus = function() {
	this._node.focus();
}

MM.Clipboard.copy = function(sourceItem) {
	this._endCut();
	this._data = sourceItem.clone();
	this._mode = "copy";

	var plaintext = this._itemToPlaintext(sourceItem);
	this._node.value = plaintext;
	this._node.selectionStart = 0;
	this._node.selectionEnd = this._node.value.length;
	setTimeout(function() { this._node.value = ""; }.bind(this), 0);
}

MM.Clipboard.paste = function(targetItem) {
	if (!this._data) { return; }

	switch (this._mode) {
		case "cut":
			if (this._data == targetItem || this._data.getParent() == targetItem) { /* abort by pasting on the same node or the parent */
				this._endCut();
				return;
			}

			var item = targetItem;
			while (!item.isRoot()) {
				if (item == this._data) { return; } /* moving to a child => forbidden */
				item = item.getParent();
			}

			var action = new MM.Action.MoveItem(this._data, targetItem);
			MM.App.action(action);

			this._endCut();
		break;

		case "copy":
			var action = new MM.Action.AppendItem(targetItem, this._data.clone());
			MM.App.action(action);
		break;
	}

}

MM.Clipboard.cut = function(sourceItem) {
	this._endCut();

	this._data = sourceItem;
	this._mode = "cut";

	var node = this._data.getDOM().node;
	node.classList.add("cut");
}

MM.Clipboard._endCut = function() {
	if (this._mode != "cut") { return; }

	var node = this._data.getDOM().node;
	node.classList.remove("cut");

	this._data = null;
	this._mode = "";
}

MM.Clipboard._itemToPlaintext = function(item, depth) {
	depth = depth || 0;

	var lines = item.getChildren().map(function(child) {
		return this._itemToPlaintext(child, depth+1);
	}, this);

	var prefix = new Array(depth+1).join("\t");
	lines.unshift(prefix + item.getText().replace(/\n/g, "<br/>"))

	return lines.join("\n") + (depth ? "" : "\n");
}
