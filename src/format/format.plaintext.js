MM.Format.Plaintext = Object.create(MM.Format, {
	id: {value: "plaintext"},
	label: {value: "Plain text"},
	extension: {value: "txt"},
	mime: {value: "application/vnd.mymind+txt"}
});

/**
 * Can serialize also a sub-tree
 */
MM.Format.Plaintext.to = function(data) {
	return this._serializeItem(data.root || data);
}

MM.Format.Plaintext.from = function(data) {
	var lines = data.split("\n").filter(function(line) {
		return line.match(/\S/);
	});

	var items = this._parseItems(lines);

	if (items.length == 1) {
		var result = {
			root: items[0]
		}
	} else {
		var result = {
			root: {
				text: "",
				children: items
			}
		}
	}
	result.root.layout = "map";

	return result;
}

MM.Format.Plaintext._serializeItem = function(item, depth) {
	depth = depth || 0;

	var lines = (item.children || []) .map(function(child) {
		return this._serializeItem(child, depth+1);
	}, this);

	var prefix = new Array(depth+1).join("\t");
	lines.unshift(prefix + item.text.replace(/\n/g, ""));

	return lines.join("\n") + (depth ? "" : "\n");
}


MM.Format.Plaintext._parseItems = function(lines) {
	var items = [];
	if (!lines.length) { return items; }
	var firstPrefix = this._parsePrefix(lines[0]);

	var currentItem = null;
	var childLines = [];

	/* finalize a block of sub-children by converting them to items and appending */
	var convertChildLinesToChildren = function() { 
		if (!currentItem || !childLines.length) { return; }
		var children = this._parseItems(childLines);
		if (children.length) { currentItem.children = children; }
		childLines = [];
	}

	lines.forEach(function(line, index) {
		if (this._parsePrefix(line) == firstPrefix) { /* new top-level item! */
			convertChildLinesToChildren.call(this); /* finalize previous item */
			currentItem = {text:line.match(/^\s*(.*)/)[1]};
			items.push(currentItem);
		} else { /* prepare as a future child */
			childLines.push(line);
		}
	}, this);

	convertChildLinesToChildren.call(this);

	return items;
}

MM.Format.Plaintext._parsePrefix = function(line) {
	return line.match(/^\s*/)[0];
}
