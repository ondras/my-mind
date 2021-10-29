import * as pubsub from "../pubsub.js";
import * as history from "../history.js";
import * as app from "../my-mind.js";
import * as help from "../ui/help.js";
import * as notes from "../ui/notes.js";
import * as ui from "../ui/ui.js";
import * as io from "../ui/io.js";
import Action, * as actions from "../action.js";
import MindMap from "../map.js";
import { Side, ChildItem } from "../item.js";


const PAN_AMOUNT = 15;

export type Key = Partial<KeyboardEvent>;

export function isMac() {
	return !!navigator.platform.match(/mac/i);
}

export let repo = new Map<string, Command>();

export default abstract class Command {
	editMode: boolean | null = false;
	keys!: Key[];

	constructor(id: string, readonly label: string) { repo.set(id, this); }

	get isValid() { return this.editMode === null || this.editMode == app.editing; }

	abstract execute(e?: KeyboardEvent): void;
}


new (class Notes extends Command {
	keys = [{keyCode: "M".charCodeAt(0), ctrlKey: true}];

	constructor() { super("notes", "Notes"); }

	execute() { notes.toggle(); }
})();

new (class Undo extends Command {
	keys = [{keyCode: "Z".charCodeAt(0), ctrlKey: true}];

	constructor() { super("undo", "Undo"); }

	get isValid() { return super.isValid && history.canBack(); }

	execute() { history.back(); }
});


new (class Redo extends Command {
	keys = [{keyCode: "Y".charCodeAt(0), ctrlKey: true}];

	constructor() { super("redo", "Redo"); }

	get isValid() { return super.isValid && history.canForward(); }

	execute() { history.forward(); }
});

new (class InsertSibling extends Command {
	keys = [{keyCode: 13}];

	constructor() { super("insert-sibling", "Insert a sibling"); }

	execute() {
		let item = app.currentItem as ChildItem;
		let action: Action;
		if (item.isRoot) {
			action = new actions.InsertNewItem(item, item.children.length);
		} else {
			let parent = (item as ChildItem).parent;
			let index = parent.children.indexOf(item);
			action = new actions.InsertNewItem(parent, index+1);
		}
		app.action(action);

		repo.get("edit")!.execute();

		pubsub.publish("command-sibling");
	}
});

new (class InsertChild extends Command {
	keys = [
		{keyCode: 9, ctrlKey:false},
		{keyCode: 45}
	];

	constructor() { super("insert-child", "Insert a child"); }

	execute() {
		let item = app.currentItem;
		let action = new actions.InsertNewItem(item, item.children.length);
		app.action(action);

		repo.get("edit")!.execute();

		pubsub.publish("command-child");
	}
});

new (class Delete extends Command {
	keys = [{keyCode: isMac() ? 8 : 46}]; // Mac keyboards' "delete" button generates 8 (backspace)

	constructor() { super("delete", "Delete an item"); }

	get isValid() { return super.isValid && !app.currentItem.isRoot; }

	execute() {
		let action = new actions.RemoveItem(app.currentItem as ChildItem);
		app.action(action);
	}
});


new (class Swap extends Command {
	keys = [
		{keyCode: 38, ctrlKey:true},
		{keyCode: 40, ctrlKey:true},
	];

	constructor() { super("swap", "Swap sibling"); }

	execute(e: KeyboardEvent) {
		let current = app.currentItem as ChildItem;
		if (current.isRoot || current.parent.children.length < 2) { return; }

		let diff: -1 | 1 = (e.keyCode == 38 ? -1 : 1);
		let action = new actions.Swap(current, diff);
		app.action(action);
	}
});

new (class SetSide extends Command {
	keys = [
		{keyCode: 37, ctrlKey:true},
		{keyCode: 39, ctrlKey:true}
	];

	constructor() { super("side", "Change side"); }

	execute(e: KeyboardEvent) {
		let current = app.currentItem as ChildItem;
		if (current.isRoot || !current.parent.isRoot) { return; }

		let side: Side = (e.keyCode == 37 ? "left" : "right");
		let action = new actions.SetSide(app.currentItem, side);
		app.action(action);
	}
});

new (class Save extends Command {
	keys = [{keyCode: "S".charCodeAt(0), ctrlKey:true, shiftKey:false}];

	constructor() { super("save", "Save map"); }

	execute() { io.quickSave(); }
});

new (class SaveAs extends Command {
	keys = [{keyCode: "S".charCodeAt(0), ctrlKey:true, shiftKey:true}];

	constructor() { super("save-as", "Save as…"); }

	execute() { io.show("save"); }
});

new (class Load extends Command {
	keys = [{keyCode: "O".charCodeAt(0), ctrlKey:true}];

	constructor() { super("load", "Load map"); }

	execute() { io.show("load"); }
});

new (class Center extends Command {
	keys = [{keyCode: 35}];

	constructor() { super("center", "Center map"); }

	execute() { app.currentMap.center(); }
});

new (class New extends Command {
	keys = [{keyCode: "N".charCodeAt(0), ctrlKey:true}];

	constructor() { super("new", "New map"); }

	execute() {
		if (!confirm("Throw away your current map and start a new one?")) { return; }
		app.showMap(new MindMap());
		pubsub.publish("map-new", this);
	}
});

new (class ZoomIn extends Command {
	keys = [{charCode:"+".charCodeAt(0)}];

	constructor() { super("zoom-in", "Zoom in"); }

	execute() { app.adjustFontSize(1); }
});

new (class ZoomOut extends Command {
	keys = [{charCode:"-".charCodeAt(0)}];

	constructor() { super("zoom-out", "Zoom out"); }

	execute() { app.adjustFontSize(-1); }
});

new (class Help extends Command {
	keys = [{charCode: "?".charCodeAt(0)}];

	constructor() { super("help", "Show/hide help"); }

	execute() { help.toggle(); }
});

new (class UI extends Command {
	keys = [{charCode: "*".charCodeAt(0)}];

	constructor() { super("ui", "Show/hide UI"); }

	execute() { ui.toggle(); }
});

new (class Pan extends Command {
	keys = [
		{keyCode: "W".charCodeAt(0), ctrlKey:false, altKey:false, metaKey:false},
		{keyCode: "A".charCodeAt(0), ctrlKey:false, altKey:false, metaKey:false},
		{keyCode: "S".charCodeAt(0), ctrlKey:false, altKey:false, metaKey:false},
		{keyCode: "D".charCodeAt(0), ctrlKey:false, altKey:false, metaKey:false}
	];

	protected chars: string[] = [];
	protected interval?: ReturnType<typeof setTimeout>;

	constructor() { super("pan", "Pan the map"); }

	execute(e: KeyboardEvent) {
		var ch = String.fromCharCode(e.keyCode);
		var index = this.chars.indexOf(ch);
		if (index > -1) { return; }

		if (!this.chars.length) {
			window.addEventListener("keyup", this);
			this.interval = setInterval(() => this.step(), 50);
		}

		this.chars.push(ch);
		this.step();
	}

	protected step() {
		const dirs: Record<string, number[]> = {
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

	handleEvent(e: KeyboardEvent) {
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
});

new (class Fold extends Command {
	keys = [{charCode: "f".charCodeAt(0), ctrlKey:false}];

	constructor() { super("fold", "Fold/Unfold"); }

	execute() {
		let item = app.currentItem;
		item.collapsed = !item.collapsed;
		app.currentMap.ensureItemVisibility(item);
	}
});
