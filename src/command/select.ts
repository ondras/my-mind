import * as app from "../my-mind.js";
import Command, { isMac } from "./command.js";
import Item, { ChildItem } from "../item.js";
import { Direction } from "../layout/layout.js";


new (class Select extends Command {
	keys = [
		{code: "ArrowLeft", ctrlKey: false},
		{code: "ArrowUp", ctrlKey: false},
		{code: "ArrowRight", ctrlKey: false},
		{code: "ArrowDown", ctrlKey: false}
	];

	constructor() { super("select", "Move selection"); }

	execute(e: KeyboardEvent) {
		let dirs: Record<string, Direction> = {
			"ArrowLeft": "left",
			"ArrowUp": "top",
			"ArrowRight": "right",
			"ArrowDown": "bottom"
		}
		let dir = dirs[e.code];

		let layout = app.currentItem.resolvedLayout;
		let item = layout.pick(app.currentItem, dir);
		app.selectItem(item);
	}

});

new (class SelectRoot extends Command {
	keys = [{code:"Home"}];

	constructor() { super("select-root", "Select root"); }

	execute() {
		let item = app.currentItem;
		while (!item.isRoot) { item = (item as ChildItem).parent; }
		app.selectItem(item);
	}
});

// Macs use "Backspace" to delete instead
if (!isMac()) {
	new (class SelectParent extends Command {
		keys = [{code:"Backspace"}];

		constructor() { super("select-parent", "Select parent"); }

		execute() {
			if (app.currentItem.isRoot) { return; }
			app.selectItem(app.currentItem.parent as Item);
		}
	});
}
