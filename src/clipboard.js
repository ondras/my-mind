MM.Clipboard = {
	_item: null,
	_mode: "",
	_delay: 50,
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
	this._empty();
}

MM.Clipboard.copy = function(sourceItem) {
	this._endCut();
	this._item = sourceItem.clone();
	this._mode = "copy";

	this._expose();
}

MM.Clipboard.paste = function(targetItem) {
	setTimeout(function() {
		var pasted = this._node.value;
		this._empty();
		if (!pasted) { return; } /* nothing */

		if (this._item && pasted == MM.Format.Plaintext.to(this._item.toJSON())) { /* pasted a previously copied/cut item */
			this._pasteItem(this._item, targetItem);
		} else { /* pasted some external data */
			this._pastePlaintext(pasted, targetItem);
		}

	}.bind(this), this._delay);
}

MM.Clipboard._pasteItem = function(sourceItem, targetItem) {
	switch (this._mode) {
		case "cut":
			if (sourceItem == targetItem || sourceItem.getParent() == targetItem) { /* abort by pasting on the same node or the parent */
				this._endCut();
				return;
			}

			var item = targetItem;
			while (!item.isRoot()) {
				if (item == sourceItem) { return; } /* moving to a child => forbidden */
				item = item.getParent();
			}

			var action = new MM.Action.MoveItem(sourceItem, targetItem);
			MM.App.action(action);

			this._endCut();
		break;

		case "copy":
			var action = new MM.Action.AppendItem(targetItem, sourceItem.clone());
			MM.App.action(action);
		break;
	}
}

MM.Clipboard._pastePlaintext = function(plaintext, targetItem) {
	if (this._mode == "cut") { this._endCut(); } /* external paste => abort cutting */

	var json = MM.Format.Plaintext.from(plaintext);
	var map = MM.Map.fromJSON(json);
	var root = map.getRoot();

	if (root.getText()) {
		var action = new MM.Action.AppendItem(targetItem, root);
		MM.App.action(action);
	} else {
		var actions = root.getChildren().map(function(item) {
			return new MM.Action.AppendItem(targetItem, item);
		});
		var action = new MM.Action.Multi(actions);
		MM.App.action(action);
	}
}

MM.Clipboard.cut = function(sourceItem) {
	this._endCut();

	this._item = sourceItem;
	this._item.getDOM().node.classList.add("cut");
	this._mode = "cut";

	this._expose();
}

/**
 * Expose plaintext data to the textarea to be copied to system clipboard. Clear afterwards.
 */
MM.Clipboard._expose = function() {
	var json = this._item.toJSON();
	var plaintext = MM.Format.Plaintext.to(json);
	this._node.value = plaintext;
	this._node.selectionStart = 0;
	this._node.selectionEnd = this._node.value.length;
	setTimeout(this._empty.bind(this), this._delay);
}

MM.Clipboard._empty = function() {
	/* safari needs a non-empty selection in order to actually perfrom a real copy on cmd+c */
	this._node.value = "\n";
	this._node.selectionStart = 0;
	this._node.selectionEnd = this._node.value.length;
}

MM.Clipboard._endCut = function() {
	if (this._mode != "cut") { return; }

	this._item.getDOM().node.classList.remove("cut");
	this._item = null;
	this._mode = "";
}
