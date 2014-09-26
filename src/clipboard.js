MM.Clipboard = {
	_item: null,
	_mode: "",
	_delay: 0,
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
	this._item = sourceItem.clone();
	this._mode = "copy";

	this._expose();
}

MM.Clipboard.paste = function(targetItem) {
	setTimeout(function() {
		var pasted = this._node.value;
		this._node.value = "";
		if (!pasted) { return; } /* nothing */

		if (this._item && pasted == this._itemToPlaintext(this._item)) { /* pasted a previously copied/cut item */
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
	var items = this._parsePlaintext(plaintext);

	if (this._mode == "cut") { this._endCut(); } /* external paste => abort cutting */

	switch (items.length) {
		case 0: return;

		case 1:
			var action = new MM.Action.AppendItem(targetItem, items[0]);
			MM.App.action(action);
		break;

		default:
			var actions = items.map(function(item) {
				return new MM.Action.AppendItem(targetItem, item);
			});
			var action = new MM.Action.Multi(actions);
			MM.App.action(action);
		break;
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
	var plaintext = this._itemToPlaintext(this._item);
	this._node.value = plaintext;
	this._node.selectionStart = 0;
	this._node.selectionEnd = this._node.value.length;
	setTimeout(function() { this._node.value = ""; }.bind(this), this._delay);
}

MM.Clipboard._endCut = function() {
	if (this._mode != "cut") { return; }

	this._item.getDOM().node.classList.remove("cut");
	this._item = null;
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

MM.Clipboard._parsePlaintext = function(plaintext) {
	var lines = plaintext.split("\n").filter(function(line) {
		return line.match(/\S/);
	});

	return this._parsePlaintextItems(lines);
}

MM.Clipboard._parsePlaintextItems = function(lines) {
	var items = [];
	if (!lines.length) { return items; }
	var firstPrefix = this._getPlaintextPrefix(lines[0]);

	var currentItem = null;
	var childLines = [];

	/* finalize a block of sub-children by converting them to items and appending */
	var convertChildLinesToChildren = function() { 
		if (!currentItem || !childLines.length) { return; }
		this._parsePlaintextItems(childLines).forEach(function(child) {
			currentItem.insertChild(child);
		});
		childLines = [];
	}

	lines.forEach(function(line, index) {
		if (this._getPlaintextPrefix(line) == firstPrefix) { /* new top-level item! */
			convertChildLinesToChildren.call(this); /* finalize previous item */

			var json = {text:line.match(/^\s*(.*)/)[1]};
			currentItem = MM.Item.fromJSON(json);
			items.push(currentItem);
		} else { /* prepare as a future child */
			childLines.push(line);
		}
	}, this);

	convertChildLinesToChildren.call(this);

	return items;
}

MM.Clipboard._getPlaintextPrefix = function(line) {
	return line.match(/^\s*/)[0];
}
