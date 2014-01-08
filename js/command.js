MM.Command = Object.create(MM.Repo, {
	keys: {value: []},
	editMode: {value: false},
	label: {value: ""}
});

MM.Command.isValid = function() {
	return (this.editMode == MM.App.editing);
}
MM.Command.execute = function() {}

MM.Command.Undo = Object.create(MM.Command, {
	label: {value: "Undo"},
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
	label: {value: "Redo"},
	keys: {value: [{charCode: "y".charCodeAt(0), ctrlKey: true}]},
});
MM.Command.Redo.isValid = function() {
	return (MM.Command.isValid.call(this) && MM.App.historyIndex != MM.App.history.length);
}
MM.Command.Redo.execute = function() {
	MM.App.history[MM.App.historyIndex].perform();
	MM.App.historyIndex++;
}

MM.Command.InsertSibling = Object.create(MM.Command, {
	label: {value: "Insert a sibling"},
	keys: {value: [{keyCode: 13}]}
});
MM.Command.InsertSibling.execute = function() {
	var item = MM.App.current;
	if (item.isRoot()) {
		var action = new MM.Action.InsertNewItem(item, item.getChildren().length);
	} else {
		var parent = item.getParent();
		var index = parent.getChildren().indexOf(item);
		var action = new MM.Action.InsertNewItem(parent, index+1);
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
	var action = new MM.Action.InsertNewItem(item, item.getChildren().length);
	MM.App.action(action);	

	MM.Command.Edit.execute();
}

MM.Command.Delete = Object.create(MM.Command, {
	label: {value: "Delete an item"},
	keys: {value: [{keyCode: 46}]}
});
MM.Command.Delete.isValid = function() {
	return MM.Command.isValid.call(this) && !MM.App.current.isRoot();
}
MM.Command.Delete.execute = function() {
	var action = new MM.Action.RemoveItem(MM.App.current);
	MM.App.action(action);	
}

MM.Command.Swap = Object.create(MM.Command, {
	label: {value: "Swap sibling"},
	keys: {value: [
		{keyCode: 33},
		{keyCode: 34},
	]}
});
MM.Command.Swap.execute = function(e) {
	var current = MM.App.current;
	if (current.isRoot() || current.getParent().getChildren().length < 2) { return; }

	var diff = (e.keyCode == 33 ? -1 : 1);
	var action = new MM.Action.Swap(MM.App.current, diff);
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
	label: {value: "Save as&hellip;"},
	keys: {value: [{charCode: "S".charCodeAt(0), ctrlKey:true, shiftKey:true}]}
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
	label: {value: "Center map"},
	keys: {value: [{keyCode: 35}]}
});
MM.Command.Center.execute = function() {
	MM.App.map.center();
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

MM.Command.UI = Object.create(MM.Command, {
	label: {value: "Show/hide UI"},
	keys: {value: [{charCode: "*".charCodeAt(0)}]}
});
MM.Command.UI.execute = function() {
	MM.App.ui.toggle();
}

MM.Command.Pan = Object.create(MM.Command, {
	label: {value: "Pan the map"},
	keys: {value: [
		{keyCode: "W".charCodeAt(0), ctrlKey:false},
		{keyCode: "A".charCodeAt(0), ctrlKey:false},
		{keyCode: "S".charCodeAt(0), ctrlKey:false},
		{keyCode: "D".charCodeAt(0), ctrlKey:false}
	]},
	chars: {value: []}
});
MM.Command.Pan.execute = function(e) {
	var ch = String.fromCharCode(e.keyCode);
	var index = this.chars.indexOf(ch);
	if (index > -1) { return; }

	if (!this.chars.length) {
		window.addEventListener("keyup", this);
		this.interval = setInterval(this._step.bind(this), 50);
	}

	this.chars.push(ch);
	this._step();
}

MM.Command.Pan._step = function() {
	var dirs = {
		"W": [0, 1],
		"A": [1, 0],
		"S": [0, -1],
		"D": [-1, 0]
	}
	var offset = [0, 0];

	this.chars.forEach(function(ch) {
		offset[0] += dirs[ch][0];
		offset[1] += dirs[ch][1];
	});

	MM.App.map.moveBy(10*offset[0], 10*offset[1]);
}

MM.Command.Pan.handleEvent = function(e) {
	var ch = String.fromCharCode(e.keyCode);
	var index = this.chars.indexOf(ch);
	if (index > -1) {
		this.chars.splice(index, 1);
		if (!this.chars.length) {
			window.removeEventListener("keyup", this);
			clearInterval(this.interval);
		}
	}
}

MM.Command.Copy = Object.create(MM.Command, {
	label: {value: "Copy"},
	keys: {value: [{charCode: "c".charCodeAt(0), ctrlKey:true}]}
});
MM.Command.Copy.execute = function() {
	MM.Clipboard.copy(MM.App.current);
}

MM.Command.Cut = Object.create(MM.Command, {
	label: {value: "Cut"},
	keys: {value: [{charCode: "x".charCodeAt(0), ctrlKey:true}]}
});
MM.Command.Cut.execute = function() {
	MM.Clipboard.cut(MM.App.current);
}

MM.Command.Paste = Object.create(MM.Command, {
	label: {value: "Paste"},
	keys: {value: [{charCode: "v".charCodeAt(0), ctrlKey:true}]}
});
MM.Command.Paste.execute = function() {
	MM.Clipboard.paste(MM.App.current);
}
