MM.Command = function() {
	this._keys = [];
	this._editMode = false;
	this._name = "";
}
MM.Command.prototype.isValid = function() {
	return (this._editMode == MM.App.editing);
}
MM.Command.prototype.getKeys = function() {
	return this._keys;
}
MM.Command.prototype.getName = function() {
	return this._name;
}
MM.Command.prototype.execute = function() {
}

MM.Command.Undo = function() {
	MM.Command.call(this);
	this._keys.push({charCode: "z".charCodeAt(0), ctrlKey: true});
	this._name = "Undo last action";
}
MM.Command.Undo.prototype = Object.create(MM.Command.prototype);
MM.Command.Undo.prototype.isValid = function() {
	return MM.Command.prototype.isValid.call(this) && !!MM.App.historyIndex;
}
MM.Command.Undo.prototype.execute = function() {
	MM.App.history[MM.App.historyIndex-1].undo();
	MM.App.historyIndex--;
}

MM.Command.Redo = function() {
	MM.Command.call(this);
	this._keys.push({charCode: "y".charCodeAt(0), ctrlKey: true});
	this._name = "Redo last action";
}
MM.Command.Redo.prototype = Object.create(MM.Command.prototype);
MM.Command.Redo.prototype.isValid = function() {
	return (MM.Command.prototype.isValid.call(this) && MM.App.historyIndex != MM.App.history.length);
}
MM.Command.Redo.prototype.execute = function() {
	MM.App.history[MM.App.historyIndex].perform();
	MM.App.historyIndex++;
}

MM.Command.Edit = function() {
	MM.Command.call(this);
	this._keys.push({keyCode: 32});
	this._keys.push({keyCode: 113});
	this._name = "Edit item";
}
MM.Command.Edit.prototype = Object.create(MM.Command.prototype);
MM.Command.Edit.prototype.execute = function() {
	MM.App.current.startEditing();
	MM.App.editing = true;
}

MM.Command.Finish = function() {
	MM.Command.call(this);
	this._keys.push({keyCode: 13});
	this._editMode = true;
}
MM.Command.Finish.prototype = Object.create(MM.Command.prototype);
MM.Command.Finish.prototype.execute = function() {
	MM.App.editing = false;
	var text = MM.App.current.stopEditing();
	var action = new MM.Action.SetText(MM.App.current, text);
	MM.App.action(action);
}

MM.Command.Cancel = function() {
	MM.Command.call(this);
	this._keys.push({keyCode: 27});
	this._editMode = true;
}
MM.Command.Cancel.prototype = Object.create(MM.Command.prototype);
MM.Command.Cancel.prototype.execute = function() {
	MM.App.editing = false;
	MM.App.current.stopEditing();
}

MM.Command.InsertSibling = function() {
	MM.Command.call(this);
	this._keys.push({keyCode: 13});
	this._name = "Insert a sibling";
}
MM.Command.InsertSibling.prototype = Object.create(MM.Command.prototype);
MM.Command.InsertSibling.prototype.execute = function() {
	var item = MM.App.current;
	var parent = item.getParent();
	if (parent) {
		var index = parent.getChildren().indexOf(item);
		var action = new MM.Action.InsertItem(parent, index+1);
	} else {
		var action = new MM.Action.InsertItem(item, item.getChildren().length);
	}
	MM.App.action(action);

	var edit = new MM.Command.Edit();
	edit.execute();
}

MM.Command.InsertChild = function() {
	MM.Command.call(this);
	this._keys.push({keyCode: 45});
	this._name = "Insert a child";
}
MM.Command.InsertChild.prototype = Object.create(MM.Command.prototype);
MM.Command.InsertChild.prototype.execute = function() {
	var item = MM.App.current;
	var action = new MM.Action.InsertItem(item, item.getChildren().length);
	MM.App.action(action);	

	var edit = new MM.Command.Edit();
	edit.execute();
}

MM.Command.Delete = function() {
	MM.Command.call(this);
	this._keys.push({keyCode: 46});
	this._name = "Delete an item";
}
MM.Command.Delete.prototype = Object.create(MM.Command.prototype);
MM.Command.Delete.prototype.isValid = function() {
	return MM.Command.prototype.isValid.call(this) && MM.App.current.getParent();
}
MM.Command.Delete.prototype.execute = function() {
	var action = new MM.Action.RemoveItem(MM.App.current);
	MM.App.action(action);	
}
