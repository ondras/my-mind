import Map from "./map.js";
import Item, { ChildItem } from "./item.js";
import * as app from "./my-mind.js";
import * as actions from "./action.js";


type Mode = "" | "copy" | "cut";
const node = document.createElement("textarea");
const DELAY = 50; // wait after ctrl+c/v so that the data is copied/pasted

let storedItem: Item | null = null;
let mode: Mode = "";

export function init() {
	node.style.position = "absolute";
	node.style.width = "0";
	node.style.height = "0";
	node.style.left = "-100px";
	node.style.top = "-100px";
	document.body.append(node);
}

export function focus() {
	node.focus();
	empty();
}

export function copy(sourceItem: Item) {
	endCut();
	storedItem = sourceItem.clone();
	mode = "copy";

	expose();
}

export function paste(targetItem: Item) {
	setTimeout(() => {
		let pasted = node.value;
		empty();
		if (!pasted) { return; } // nothing

		if (storedItem && pasted == MM.Format.Plaintext.to(storedItem.toJSON())) { // pasted a previously copied/cut item
			pasteItem(storedItem, targetItem);
		} else { // pasted some external data
			pastePlaintext(pasted, targetItem);
		}

	}, DELAY);
}

function pasteItem(sourceItem: Item, targetItem: Item) {
	let action;

	switch (mode) {
		case "cut":
			if (sourceItem == targetItem || sourceItem.parent == targetItem) { // abort by pasting on the same node or the parent
				endCut();
				return;
			}

			let item = targetItem;
			while (true) {
				if (item == sourceItem) { return; } // moving to a child => forbidden
				if (item.parent instanceof Map) { break; }
				item = item.parent;
			}

			action = new actions.MoveItem(sourceItem as ChildItem, targetItem);
			app.action(action);

			endCut();
		break;

		case "copy":
			action = new actions.AppendItem(targetItem, sourceItem.clone());
			app.action(action);
		break;
	}
}

function pastePlaintext(plaintext: string, targetItem: Item) {
	if (mode == "cut") { endCut(); } // external paste => abort cutting

	let json = MM.Format.Plaintext.from(plaintext);
	let map = Map.fromJSON(json);
	let root = map.root;

	if (root.text) {
		let action = new actions.AppendItem(targetItem, root);
		app.action(action);
	} else {
		let actions = root.children.map(item => new actions.AppendItem(targetItem, item));
		let action = new actions.Multi(actions);
		app.action(action);
	}
}

export function cut(sourceItem: Item) {
	endCut();

	storedItem = sourceItem;
	storedItem.dom.node.classList.add("cut");
	mode = "cut";

	expose();
}

/**
 * Expose plaintext data to the textarea to be copied to system clipboard. Clear afterwards.
 */
function expose() {
	let json = storedItem.toJSON();
	let plaintext = MM.Format.Plaintext.to(json);
	node.value = plaintext;
	node.selectionStart = 0;
	node.selectionEnd = node.value.length;
	setTimeout(empty, DELAY);
}

function empty() {
	// safari needs a non-empty selection in order to actually perfrom a real copy on cmd+c
	node.value = "\n";
	node.selectionStart = 0;
	node.selectionEnd = node.value.length;
}

function endCut() {
	if (mode != "cut") { return; }

	storedItem.dom.node.classList.remove("cut");
	storedItem = null;
	mode = "";
}
