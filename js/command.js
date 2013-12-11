MM.Command = {
	ALL: [],
	_keys: [],
	_editMode: false,
	_name: ""
}
MM.Command.isValid = function() {
	return (this._editMode == MM.App.editing);
}
MM.Command.getKeys = function() {
	return this._keys;
}
MM.Command.getName = function() {
	return this._name;
}
MM.Command.execute = function() {
}
MM.Command.init = function() {
}

MM.Command.Undo = Object.create(MM.Command);
MM.Command.Undo._keys = [{charCode: "z".charCodeAt(0), ctrlKey: true}];
MM.Command.Undo._name = "Undo last action";
MM.Command.Undo.isValid = function() {
	return MM.Command.isValid.call(this) && !!MM.App.historyIndex;
}
MM.Command.Undo.execute = function() {
	MM.App.history[MM.App.historyIndex-1].undo();
	MM.App.historyIndex--;
}

MM.Command.Redo = Object.create(MM.Command);
MM.Command.Redo._keys = [{charCode: "y".charCodeAt(0), ctrlKey: true}];
MM.Command.Redo._name = "Redo last action";
MM.Command.Redo.isValid = function() {
	return (MM.Command.isValid.call(this) && MM.App.historyIndex != MM.App.history.length);
}
MM.Command.Redo.execute = function() {
	MM.App.history[MM.App.historyIndex].perform();
	MM.App.historyIndex++;
}

MM.Command.Edit = Object.create(MM.Command);
MM.Command.Edit._keys = [
	{keyCode: 32},
	{keyCode: 113}
];
MM.Command.Edit._name = "Edit item";
MM.Command.Edit.execute = function() {
	MM.App.current.startEditing();
	MM.App.editing = true;
}

MM.Command.Finish = Object.create(MM.Command);
MM.Command.Finish._keys = [{keyCode: 13}];
MM.Command.Finish._editMode = true;
MM.Command.Finish.execute = function() {
	MM.App.editing = false;
	var text = MM.App.current.stopEditing();
	var action = new MM.Action.SetText(MM.App.current, text);
	MM.App.action(action);
}

MM.Command.Newline = Object.create(MM.Command);
MM.Command.Newline._keys = [
	{keyCode: 13, altKey:true},
	{keyCode: 13, ctrlKey:true}
];
MM.Command.Newline._editMode = true;
MM.Command.Newline.execute = function() {
	var range = getSelection().getRangeAt(0);
	var br = document.createElement("br");
	range.insertNode(br);
	range.setStartAfter(br);
}

MM.Command.Cancel = Object.create(MM.Command);
MM.Command.Cancel._keys = [{keyCode: 27}];
MM.Command.Cancel._editMode = true;
MM.Command.Cancel.execute = function() {
	MM.App.editing = false;
	MM.App.current.stopEditing();
}

MM.Command.InsertSibling = Object.create(MM.Command);
MM.Command.InsertSibling._keys = [{keyCode: 13}];
MM.Command.InsertSibling._name = "Insert a sibling";
MM.Command.InsertSibling.execute = function() {
	var item = MM.App.current;
	var parent = item.getParent();
	if (parent) {
		var index = parent.getChildren().indexOf(item);
		var action = new MM.Action.InsertItem(parent, index+1);
	} else {
		var action = new MM.Action.InsertItem(item, item.getChildren().length);
	}
	MM.App.action(action);

	MM.Command.Edit.execute();
}

MM.Command.InsertChild = Object.create(MM.Command);
MM.Command.InsertChild._keys = [{keyCode: 45}];
MM.Command.InsertChild._name = "Insert a child";
MM.Command.InsertChild.execute = function() {
	var item = MM.App.current;
	var action = new MM.Action.InsertItem(item, item.getChildren().length);
	MM.App.action(action);	

	MM.Command.Edit.execute();
}

MM.Command.Delete = Object.create(MM.Command);
MM.Command.Delete._keys = [{keyCode: 46}];
MM.Command.Delete._name = "Delete an item";
MM.Command.Delete.isValid = function() {
	return MM.Command.isValid.call(this) && MM.App.current.getParent();
}
MM.Command.Delete.execute = function() {
	var action = new MM.Action.RemoveItem(MM.App.current);
	MM.App.action(action);	
}
