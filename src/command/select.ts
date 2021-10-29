import * as app from "../my-mind.js";
import Command, { isMac } from "./command.js";
import Item, { ChildItem } from "../item.js";
import { Direction } from "../layout/layout.js";


new (class Select extends Command {
	keys = [
		{keyCode: 38, ctrlKey: false},
		{keyCode: 37, ctrlKey: false},
		{keyCode: 40, ctrlKey: false},
		{keyCode: 39, ctrlKey: false}
	];

	constructor() { super("select", "Move selection"); }

	execute(e: KeyboardEvent) {
		let dirs: Record<number, Direction> = {
			37: "left",
			38: "top",
			39: "right",
			40: "bottom"
		}
		let dir = dirs[e.keyCode];

		let layout = app.currentItem.resolvedLayout;
		let item = layout.pick(app.currentItem, dir);
		app.selectItem(item);
	}

});

new (class SelectRoot extends Command {
	keys = [{keyCode: 36}];

	constructor() { super("select-root", "Select root"); }

	execute() {
		let item = app.currentItem;
		while (!item.isRoot) { item = (item as ChildItem).parent; }
		app.selectItem(item);
	}
});

// Macs use keyCode 8 to delete instead
if (!isMac()) {
	new (class SelectParent extends Command {
		keys = [{keyCode: 8}];

		constructor() { super("select-parent", "Select parent"); }

		execute() {
			if (app.currentItem.isRoot) { return; }
			app.selectItem(app.currentItem.parent as Item);
		}
	});
}
