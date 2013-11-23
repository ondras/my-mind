MM.Command = function() {
	this._keys = [];
}
MM.Command.prototype.isValid = function() {
	return false;
}
MM.Command.prototype.getKeys = function() {
	return this._keys;
}
MM.Command.prototype.execute = function() {
}

MM.Command.Undo = function() {
	MM.Command.call(this);
	this._keys.push({charCode: "z".charCodeAt(0), ctrlKey: true, type:"keypress"});
}
MM.Command.Undo.prototype = Object.create(MM.Command.prototype);
MM.Command.Undo.prototype.isValid = function() {
	return !!MM.App.historyIndex && !MM.App.editing;
}
MM.Command.Undo.prototype.execute = function() {
	MM.App.history[MM.App.historyIndex-1].undo();
	MM.App.historyIndex--;
}

MM.Command.Redo = function() {
	MM.Command.call(this);
	this._keys.push({charCode: "y".charCodeAt(0), ctrlKey: true, type:"keypress"});
}
MM.Command.Redo.prototype = Object.create(MM.Command.prototype);
MM.Command.Redo.prototype.isValid = function() {
	return (MM.App.historyIndex != MM.App.history.length && !MM.App.editing);
}
MM.Command.Redo.prototype.execute = function() {
	MM.App.history[MM.App.historyIndex].perform();
	MM.App.historyIndex++;
}

MM.Command.Edit = function() {
	MM.Command.call(this);
	this._keys.push({keyCode: 32, type:"keydown"});
}
MM.Command.Edit.prototype = Object.create(MM.Command.prototype);
MM.Command.Edit.prototype.isValid = function() {
	return (MM.App.selection.get().length == 1 && !MM.App.editing);
};
MM.Command.Edit.prototype.execute = function() {
	if (MM.App.editing) {
		 /* FIXME */
	}
	var item = MM.App.selection.get()[0];
	item.startEditing();
	MM.App.editing = item;
}

MM.Command.Finish = function() {
	MM.Command.call(this);
	this._keys.push({keyCode: 13, type:"keydown"});
}
MM.Command.Finish.prototype = Object.create(MM.Command.prototype);
MM.Command.Finish.prototype.isValid = function() {
	return !!MM.App.editing;
};
MM.Command.Finish.prototype.execute = function() {
	var text = MM.App.editing.stopEditing();
	MM.App.editing = null;
	var action = new MM.Action.SetText(MM.App.selection.get()[0], text);
	MM.App.action(action);
}
