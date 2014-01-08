MM.Clipboard = {
	_data: null,
	_mode: ""
};

MM.Clipboard.copy = function(sourceItem) {
	this._endCut();

	this._data = sourceItem.clone();
	this._mode = "copy";
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
