MM.Command = {
	keys: [],
	editMode: false,
	label: ""
}
MM.Command.isValid = function() {
	return (this.editMode == MM.App.editing);
}
MM.Command.execute = function() {}

MM.Command.Undo = Object.create(MM.Command, {
	label: {value: "Undo last action"},
	keys: {value: [{charCode: "z".charCodeAt(0), ctrlKey: true}]}
});
MM.Command.Undo.isValid = function() {
	return MM.Command.isValid.call(this) && !!MM.App.historyIndex;
}
MM.Command.Undo.execute = function() {
	MM.App.history[MM.App.historyIndex-1].undo();
	MM.App.historyIndex--;
}

MM.Command.Redo = Object.create(MM.Command, {
	label: {value: "Redo last action"},
	keys: {value: [{charCode: "y".charCodeAt(0), ctrlKey: true}]},
});
MM.Command.Redo.isValid = function() {
	return (MM.Command.isValid.call(this) && MM.App.historyIndex != MM.App.history.length);
}
MM.Command.Redo.execute = function() {
	MM.App.history[MM.App.historyIndex].perform();
	MM.App.historyIndex++;
}

MM.Command.Edit = Object.create(MM.Command, {
	label: {value: "Edit item"},
	keys: {value: [
		{keyCode: 32},
		{keyCode: 113}
	]}
});
MM.Command.Edit.execute = function() {
	MM.App.current.startEditing();
	MM.App.editing = true;
}

MM.Command.Finish = Object.create(MM.Command, {
	keys: {value: [{keyCode: 13}]},
	editMode: {value: true}
});
MM.Command.Finish.execute = function() {
	MM.App.editing = false;
	var text = MM.App.current.stopEditing();
	var action = new MM.Action.SetText(MM.App.current, text);
	MM.App.action(action);
}

MM.Command.Newline = Object.create(MM.Command, {
	label: {value: "Line break"},
	keys: {value: [
		{keyCode: 13, altKey:true},
		{keyCode: 13, ctrlKey:true}
	]},
	editMode: {value: true}
});
MM.Command.Newline.execute = function() {
	var range = getSelection().getRangeAt(0);
	var br = document.createElement("br");
	range.insertNode(br);
	range.setStartAfter(br);
}

MM.Command.Cancel = Object.create(MM.Command, {
	editMode: {value: true},
	keys: {value: [{keyCode: 27}]}
});
MM.Command.Cancel.execute = function() {
	MM.App.editing = false;
	MM.App.current.stopEditing();
}

MM.Command.InsertSibling = Object.create(MM.Command, {
	label: {value: "Insert a sibling"},
	keys: {value: [{keyCode: 13}]}
});
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

MM.Command.InsertChild = Object.create(MM.Command, {
	label: {value: "Insert a child"},
	keys: {value: [{keyCode: 45}]}
});
MM.Command.InsertChild.execute = function() {
	var item = MM.App.current;
	var action = new MM.Action.InsertItem(item, item.getChildren().length);
	MM.App.action(action);	

	MM.Command.Edit.execute();
}

MM.Command.Delete = Object.create(MM.Command, {
	label: {value: "Delete an item"},
	keys: {value: [{keyCode: 46}]}
});
MM.Command.Delete.isValid = function() {
	return MM.Command.isValid.call(this) && MM.App.current.getParent();
}
MM.Command.Delete.execute = function() {
	var action = new MM.Action.RemoveItem(MM.App.current);
	MM.App.action(action);	
}

MM.Command.Save = Object.create(MM.Command, {
	label: {value: "Save map"},
	keys: {value: [{charCode: "s".charCodeAt(0), ctrlKey:true}]}
});
MM.Command.Save.execute = function() {
	MM.App.io.quickSave();
}

MM.Command.SaveAs = Object.create(MM.Command, {
	label: {value: "Save map as&hellip;"},
	keys: {value: [{charCode: "S".charCodeAt(0), ctrlKey:true}]}
});
MM.Command.SaveAs.execute = function() {
	MM.App.io.show("save");
}

MM.Command.Load = Object.create(MM.Command, {
	label: {value: "Load map"},
	keys: {value: [{charCode: "o".charCodeAt(0), ctrlKey:true}]}
});
MM.Command.Load.execute = function() {
	MM.App.io.show("load");
}

MM.Command.Center = Object.create(MM.Command, {
	label: {value: "Center map"}
});
MM.Command.Center.execute = function() {
	MM.App.map.moveTo(0, 0);
}

MM.Command.New = Object.create(MM.Command, {
	label: {value: "New map"},
	keys: {value: [{charCode: "n".charCodeAt(0), ctrlKey:true}]}
});
MM.Command.New.execute = function() {
	if (!confirm("Throw away your current map and start a new one?")) { return; }
	var map = new MM.Map();
	MM.App.setMap(map);
	MM.publish("map-new", this);
}

MM.Command.ZoomIn = Object.create(MM.Command, {
	label: {value: "Zoom in"},
	keys: {value: [{charCode:"+".charCodeAt(0)}]}
});
MM.Command.ZoomIn.execute = function() {
	MM.App.adjustFontSize(1);
}

MM.Command.ZoomOut = Object.create(MM.Command, {
	label: {value: "Zoom out"},
	keys: {value: [{charCode:"-".charCodeAt(0)}]}
});
MM.Command.ZoomOut.execute = function() {
	MM.App.adjustFontSize(-1);
}

MM.Command.Help = Object.create(MM.Command, {
	label: {value: "Show/hide help"},
	keys: {value: [{charCode: "?".charCodeAt(0)}]}
});
MM.Command.Help.execute = function() {
	MM.App.help.toggle();
}
