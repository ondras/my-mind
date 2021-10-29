import * as app from "../my-mind.js";
import Action, * as actions from "../action.js";
import * as notes from "../ui/notes.js";
import * as help from "../ui/help.js";
import * as io from "../ui/io.js";
import Command, { repo as commandRepo } from "./command.js";
import { ChildItem, Status } from "../item.js";


new (class Edit extends Command {
	keys = [
		{code:"Space"},
		{code:"F2"}
	];

	constructor() { super("edit", "Edit item"); }

	execute() { app.startEditing(); }
});

new (class Finish extends Command {
	keys = [{code:"Enter", altKey:false, ctrlKey:false, shiftKey:false}];
	editMode = true;

	constructor() { super("finish", "Finish editing"); }

	execute() {
		let text = app.stopEditing();
		let action: Action;
		if (text) {
			action = new actions.SetText(app.currentItem, text);
		} else {
			action = new actions.RemoveItem(app.currentItem as ChildItem);
		}
		app.action(action);
	}
});

new (class Newline extends Command {
	keys = [
		{code:"Enter", shiftKey:true},
		{code:"Enter", ctrlKey:true}
	];
	editMode = true;

	constructor() { super("newline", "Line break"); }

	execute() {
		let range = getSelection()!.getRangeAt(0);
		let br = document.createElement("br");
		range.insertNode(br);
		range.setStartAfter(br);
		app.currentItem.update({parent:true, children:true});
	}
});

new (class Cancel extends Command {
	keys = [{code:"Escape"}];
	editMode = null;

	constructor() { super("cancel", "Cancel"); }

	execute() {
		if (app.editing) {
			app.stopEditing();
			var oldText = app.currentItem.text;
			if (!oldText) { // newly added node
				var action = new actions.RemoveItem(app.currentItem as ChildItem);
				app.action(action);
			}
		} else {
			notes.close();
			help.close();
			io.hide();
		}
	}
});

abstract class Style extends Command {
	editMode = null;
	command!: string;

	execute() {
		if (app.editing) {
			document.execCommand(this.command, false);
		} else {
			commandRepo.get("edit")!.execute();
			let selection = getSelection()!;
			let range = selection.getRangeAt(0);
			range.selectNodeContents(app.currentItem.dom.text);
			selection.removeAllRanges();
			selection.addRange(range);
			this.execute();
			commandRepo.get("finish")!.execute();
		}
	}
}

new (class Bold extends Style {
	keys = [{code:"KeyB", ctrlKey:true}];
	command = "bold";

	constructor() { super("bold", "Bold"); }
});

new (class Underline extends Style {
	keys = [{code:"KeyU", ctrlKey:true}];
	command = "underline";

	constructor() { super("underline", "Underline"); }
});

new (class Italic extends Style {
	keys = [{code:"KeyI", ctrlKey:true}];
	command = "italic";

	constructor() { super("italic", "Italic"); }
});

new (class Strikethrough extends Style {
	keys = [{code:"KeyS", ctrlKey:true}];
	command = "strikeThrough";

	constructor() { super("strikethrough", "Strike-through"); }
});

new (class Value extends Command {
	keys = [{key:"v", ctrlKey:false, metaKey:false}];

	constructor() { super("value", "Set value"); }

	execute() {
		let item = app.currentItem;
		let oldValue = item.value;
		let newValue = prompt("Set item value", String(oldValue));
		if (newValue == null) { return; }

		if (!newValue.length) { newValue = null; }

		let numValue = Number(newValue);
		let action = new actions.SetValue(item, isNaN(numValue) ? newValue : numValue);
		app.action(action);
	}
});

new (class Yes extends Command {
	keys = [{key:"y", ctrlKey:false}];

	constructor() { super("yes", "Yes"); }

	execute() {
		let item = app.currentItem;
		let status = (item.status === true ? null : true);
		let action = new actions.SetStatus(item, status);
		app.action(action);
	}
});

new (class No extends Command {
	keys = [{key:"n", ctrlKey:false}];

	constructor() { super("no", "No"); }

	execute() {
		let item = app.currentItem;
		let status = (item.status === false ? null : false);
		let action = new actions.SetStatus(item, status);
		app.action(action);
	}
});

new (class Computed extends Command {
	keys = [{key:"c", ctrlKey:false, metaKey:false}];

	constructor() { super("computed", "Computed"); }

	execute() {
		let item = app.currentItem;
		let status: Status = (item.status == "computed" ? null : "computed");
		let action = new actions.SetStatus(item, status);
		app.action(action);
	}
});
