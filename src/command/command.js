import * as pubsub from "../pubsub.js";
import * as history from "../history.js";
import * as app from "../my-mind.js";
import * as help from "../ui/help.js";
import * as notes from "../ui/notes.js";
import * as clipboard from "../clipboard.js";
import * as actions from "../action.js";
import * as ui from "../ui/ui.js";
import Map from "../map.js";


const PAN_AMOUNT = 15;

export function isMac() {
	return !!navigator.platform.match(/mac/i);
}


MM.Command = Object.create(MM.Repo, {
	keys: {value: []},
	editMode: {value: false},
	prevent: {value: true}, /* prevent default keyboard action? */
	label: {value: ""}
});

MM.Command.isValid = function() {
	return (this.editMode === null || this.editMode == app.editing);
}
MM.Command.execute = function() {}

MM.Command.Notes = Object.create(MM.Command, {
	label: {value: "Notes"},
	keys: {value: [{keyCode: "M".charCodeAt(0), ctrlKey: true}]}
});

MM.Command.Notes.isValid = function() {
	return MM.Command.isValid.call(this);
}

MM.Command.Notes.execute = function() {
	notes.toggle();
}

MM.Command.Undo = Object.create(MM.Command, {
	label: {value: "Undo"},
	keys: {value: [{keyCode: "Z".charCodeAt(0), ctrlKey: true}]}
});
MM.Command.Undo.isValid = function() {
	return MM.Command.isValid.call(this) && history.canBack();
}
MM.Command.Undo.execute = function() {
	history.back();
}

MM.Command.Redo = Object.create(MM.Command, {
	label: {value: "Redo"},
	keys: {value: [{keyCode: "Y".charCodeAt(0), ctrlKey: true}]},
});
MM.Command.Redo.isValid = function() {
	return (MM.Command.isValid.call(this) && history.canForward());
}
MM.Command.Redo.execute = function() {
	history.forward();
}

MM.Command.InsertSibling = Object.create(MM.Command, {
	label: {value: "Insert a sibling"},
	keys: {value: [{keyCode: 13}]}
});
MM.Command.InsertSibling.execute = function() {
	var item = app.currentItem;
	if (item.isRoot) {
		var action = new actions.InsertNewItem(item, item.children.length);
	} else {
		var parent = item.parent;
		var index = parent.children.indexOf(item);
		var action = new actions.InsertNewItem(parent, index+1);
	}
	app.action(action);

	MM.Command.Edit.execute();

	pubsub.publish("command-sibling");
}

MM.Command.InsertChild = Object.create(MM.Command, {
	label: {value: "Insert a child"},
	keys: {value: [
		{keyCode: 9, ctrlKey:false},
		{keyCode: 45}
	]}
});
MM.Command.InsertChild.execute = function() {
	var item = app.currentItem;
	var action = new actions.InsertNewItem(item, item.children.length);
	app.action(action);

	MM.Command.Edit.execute();

	pubsub.publish("command-child");
}

MM.Command.Delete = Object.create(MM.Command, {
	label: {value: "Delete an item"},
	keys: {value: [{keyCode: isMac() ? 8 : 46}]} // Mac keyboards' "delete" button generates 8 (backspace)
});
MM.Command.Delete.isValid = function() {
	return MM.Command.isValid.call(this) && !app.currentItem.isRoot;
}
MM.Command.Delete.execute = function() {
	var action = new actions.RemoveItem(app.currentItem);
	app.action(action);
}

MM.Command.Swap = Object.create(MM.Command, {
	label: {value: "Swap sibling"},
	keys: {value: [
		{keyCode: 38, ctrlKey:true},
		{keyCode: 40, ctrlKey:true},
	]}
});
MM.Command.Swap.execute = function(e) {
	var current = app.currentItem;
	if (current.isRoot || current.parent.children.length < 2) { return; }

	var diff = (e.keyCode == 38 ? -1 : 1);
	var action = new actions.Swap(app.currentItem, diff);
	app.action(action);
}

MM.Command.Side = Object.create(MM.Command, {
	label: {value: "Change side"},
	keys: {value: [
		{keyCode: 37, ctrlKey:true},
		{keyCode: 39, ctrlKey:true},
	]}
});
MM.Command.Side.execute = function(e) {
	var current = app.currentItem;
	if (current.isRoot || !current.parent.isRoot) { return; }

	var side = (e.keyCode == 37 ? "left" : "right");
	var action = new actions.SetSide(app.currentItem, side);
	app.action(action);
}

MM.Command.Save = Object.create(MM.Command, {
	label: {value: "Save map"},
	keys: {value: [{keyCode: "S".charCodeAt(0), ctrlKey:true, shiftKey:false}]}
});
MM.Command.Save.execute = function() {
	MM.App.io.quickSave();
}

MM.Command.SaveAs = Object.create(MM.Command, {
	label: {value: "Save as&hellip;"},
	keys: {value: [{keyCode: "S".charCodeAt(0), ctrlKey:true, shiftKey:true}]}
});
MM.Command.SaveAs.execute = function() {
	MM.App.io.show("save");
}

MM.Command.Load = Object.create(MM.Command, {
	label: {value: "Load map"},
	keys: {value: [{keyCode: "O".charCodeAt(0), ctrlKey:true}]}
});
MM.Command.Load.execute = function() {
	MM.App.io.show("load");
}

MM.Command.Center = Object.create(MM.Command, {
	label: {value: "Center map"},
	keys: {value: [{keyCode: 35}]}
});
MM.Command.Center.execute = function() {
	app.currentMap.center();
}

MM.Command.New = Object.create(MM.Command, {
	label: {value: "New map"},
	keys: {value: [{keyCode: "N".charCodeAt(0), ctrlKey:true}]}
});
MM.Command.New.execute = function() {
	if (!confirm("Throw away your current map and start a new one?")) { return; }
	app.showMap(new Map());
	pubsub.publish("map-new", this);
}

MM.Command.ZoomIn = Object.create(MM.Command, {
	label: {value: "Zoom in"},
	keys: {value: [{charCode:"+".charCodeAt(0)}]}
});
MM.Command.ZoomIn.execute = function() {
	app.adjustFontSize(1);
}

MM.Command.ZoomOut = Object.create(MM.Command, {
	label: {value: "Zoom out"},
	keys: {value: [{charCode:"-".charCodeAt(0)}]}
});
MM.Command.ZoomOut.execute = function() {
	app.adjustFontSize(-1);
}

MM.Command.Help = Object.create(MM.Command, {
	label: {value: "Show/hide help"},
	keys: {value: [{charCode: "?".charCodeAt(0)}]}
});
MM.Command.Help.execute = function() {
	help.toggle();
}

MM.Command.UI = Object.create(MM.Command, {
	label: {value: "Show/hide UI"},
	keys: {value: [{charCode: "*".charCodeAt(0)}]}
});
MM.Command.UI.execute = function() {
	ui.toggle();
}

MM.Command.Pan = Object.create(MM.Command, {
	label: {value: "Pan the map"},
	keys: {value: [
		{keyCode: "W".charCodeAt(0), ctrlKey:false, altKey:false, metaKey:false},
		{keyCode: "A".charCodeAt(0), ctrlKey:false, altKey:false, metaKey:false},
		{keyCode: "S".charCodeAt(0), ctrlKey:false, altKey:false, metaKey:false},
		{keyCode: "D".charCodeAt(0), ctrlKey:false, altKey:false, metaKey:false}
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
	let offset = [0, 0];

	this.chars.forEach(ch => {
		offset[0] += dirs[ch][0] * PAN_AMOUNT;
		offset[1] += dirs[ch][1] * PAN_AMOUNT;
	});

	app.currentMap.moveBy(offset);
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
	prevent: {value: false},
	keys: {value: [
		{keyCode: "C".charCodeAt(0), ctrlKey:true},
		{keyCode: "C".charCodeAt(0), metaKey:true}
	]}
});
MM.Command.Copy.execute = function() {
	clipboard.copy(app.currentItem);
}

MM.Command.Cut = Object.create(MM.Command, {
	label: {value: "Cut"},
	prevent: {value: false},
	keys: {value: [
		{keyCode: "X".charCodeAt(0), ctrlKey:true},
		{keyCode: "X".charCodeAt(0), metaKey:true}
	]}
});
MM.Command.Cut.execute = function() {
	clipboard.cut(app.currentItem);
}

MM.Command.Paste = Object.create(MM.Command, {
	label: {value: "Paste"},
	prevent: {value: false},
	keys: {value: [
		{keyCode: "V".charCodeAt(0), ctrlKey:true},
		{keyCode: "V".charCodeAt(0), metaKey:true}
	]}
});
MM.Command.Paste.execute = function() {
	clipboard.paste(app.currentItem);
}

MM.Command.Fold = Object.create(MM.Command, {
	label: {value: "Fold/Unfold"},
	keys: {value: [{charCode: "f".charCodeAt(0), ctrlKey:false}]}
});
MM.Command.Fold.execute = function() {
	var item = app.currentItem;
	if (item.isCollapsed()) { item.expand(); } else { item.collapse(); }
	app.currentMap.ensureItemVisibility(item);
}
