import { isMac } from "./command.js";


MM.Command.Select = Object.create(MM.Command, {
	label: {value: "Move selection"},
	keys: {value: [
		{keyCode: 38, ctrlKey:false},
		{keyCode: 37, ctrlKey:false},
		{keyCode: 40, ctrlKey:false},
		{keyCode: 39, ctrlKey:false}
	]}
});
MM.Command.Select.execute = function(e) {
	var dirs = {
		37: "left",
		38: "top",
		39: "right",
		40: "bottom"
	}
	var dir = dirs[e.keyCode];

	var layout = app.currentItem.resolvedLayout;
	var item = layout.pick(app.currentItem, dir);
	app.selectItem(item);
}

MM.Command.SelectRoot = Object.create(MM.Command, {
	label: {value: "Select root"},
	keys: {value: [{keyCode: 36}]}
});
MM.Command.SelectRoot.execute = function() {
	var item = app.currentItem;
	while (!item.isRoot) { item = item.parent; }
	app.selectItem(item);
}

// Macs use keyCode 8 to delete instead
if (!isMac()) {
	MM.Command.SelectParent = Object.create(MM.Command, {
		label: {value: "Select parent"},
		keys: {value: [{keyCode: 8}]}
	});
	MM.Command.SelectParent.execute = function() {
		if (app.currentItem.isRoot) { return; }
		app.selectItem(app.currentItem.parent);
	}
}
