import Map from "./map.js";
import Item, { ChildItem } from "./item.js";
import * as app from "./my-mind.js";
import * as ui from "./ui/ui.js";
import Action, * as actions from "./action.js";
import { repo as formatRepo } from "./format/format.js";


type Mode = "" | "copy" | "cut";

let storedItem: Item | null = null;
let mode: Mode = "";

export function init() {
	document.body.addEventListener("cut", onCopyCut);
	document.body.addEventListener("copy", onCopyCut);
	document.body.addEventListener("paste", onPaste);
}

function onCopyCut(e: ClipboardEvent) {
	if (ui.isActive() || app.editing) { return; }
	e.preventDefault();

	endCut();

	switch (e.type) {
		case "copy":
			storedItem = app.currentItem.clone();
		break;

		case "cut":
			storedItem = app.currentItem;
			storedItem.dom.node.classList.add("cut");
		break;

		default: return; // TS needs non-null storedItem
	}

	let json = storedItem.toJSON();
	let plaintext = formatRepo.get("plaintext")!.to(json);

	e.clipboardData!.setData("text/plain", plaintext);
	mode = e.type as Mode;
}

function onPaste(e: ClipboardEvent) {
	if (ui.isActive() || app.editing) { return; }
	e.preventDefault();

	let pasted = e.clipboardData!.getData("text/plain");
	if (!pasted) { return; }

	if (storedItem && pasted == formatRepo.get("plaintext")!.to(storedItem.toJSON())) {
		// pasted a previously copied/cut item
		pasteItem(storedItem, app.currentItem);
	} else {
		// pasted some external data
		pastePlaintext(pasted, app.currentItem);
	}
	endCut();
}

function pasteItem(sourceItem: Item, targetItem: Item) {
	let action: Action;

	switch (mode) {
		case "cut":
			// abort by pasting on the same node or the parent
			if (sourceItem == targetItem || sourceItem.parent == targetItem) { return ; }

			let item = targetItem;
			while (true) {
				if (item == sourceItem) { return; } // moving to a child => forbidden
				if (item.parent instanceof Map) { break; }
				item = item.parent as Item;
			}

			action = new actions.MoveItem(sourceItem as ChildItem, targetItem);
			app.action(action);
		break;

		case "copy":
			action = new actions.AppendItem(targetItem, sourceItem.clone());
			app.action(action);
		break;
	}
}

function pastePlaintext(plaintext: string, targetItem: Item) {
	let json = formatRepo.get("plaintext")!.from(plaintext);
	let map = Map.fromJSON(json);
	let root = map.root;

	if (root.text) {
		let action = new actions.AppendItem(targetItem, root);
		app.action(action);
	} else {
		let subactions = root.children.map(item => new actions.AppendItem(targetItem, item));
		let action = new actions.Multi(subactions);
		app.action(action);
	}
}

function endCut() {
	if (mode != "cut") { return; }

	storedItem!.dom.node.classList.remove("cut");
	storedItem = null;
	mode = "";
}
