MM.Clipboard = {
	_data: null,
	_mode: ""
};

MM.Clipboard.copy = function(sourceItem) {
	this._data = sourceItem.clone();
	this._mode = "copy";
}

MM.Clipboard.paste = function(targetItem) {
	if (!this._data) { return; }

	switch (this._mode) {
		case "cut":
			var item = targetItem;
			while (!item.isRoot()) {
				if (item == this._data) { return; } /* moving to a child => forbidden */
				item = item.getParent();
			}

			if (this._data.getParent() == targetItem) { return; } /* moving to a parent => noop */

			var action = new MM.Action.MoveItem(this._data, targetItem);
			MM.App.action(action);
			this._data = null;
		break;

		case "copy":
			var action = new MM.Action.AppendItem(targetItem, this._data.clone());
			MM.App.action(action);
		break;
	}
}

MM.Clipboard.cut = function(sourceItem) {
	this._data = sourceItem;
	this._mode = "cut";
}
