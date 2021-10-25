import "./mm.js";
import "./promise.js";
import "./repo.js";
import "./action.js";
import "./command/command.js";
import "./command/command.edit.js";
import "./command/command.select.js";
import "./format/format.js";
import "./format/format.json.js";
import "./format/format.freemind.js";
import "./format/format.mma.js";
import "./format/format.mup.js";
import "./format/format.plaintext.js";
import "./backend/backend.js";
import "./backend/backend.local.js";
import "./backend/backend.webdav.js";
import "./backend/backend.image.js";
import "./backend/backend.file.js";
import "./backend/backend.firebase.js";
import "./backend/backend.gdrive.js";
import "./ui/ui.io.js";
import "./ui/backend/ui.backend.js";
import "./ui/backend/ui.backend.file.js";
import "./ui/backend/ui.backend.webdav.js";
import "./ui/backend/ui.backend.image.js";
import "./ui/backend/ui.backend.local.js";
import "./ui/backend/ui.backend.firebase.js";
import "./ui/backend/ui.backend.gdrive.js";

import Map from "./map.js";
import Item from "./item.js";
import * as pubsub from "./pubsub.js";
import * as keyboard from "./keyboard.js";
import * as mouse from "./mouse.js";
import * as menu from "./menu.js";
import * as history from "./history.js";
import * as clipboard from "./clipboard.js";
import * as ui from "./ui/ui.js";
import * as help from "./ui/help.js";
import * as notes from "./ui/notes.js";


/*
setInterval(function() {
	console.log(document.activeElement);
}, 1000);
*/

/*
 * Notes regarding app state/modes, activeElements, focusing etc.
 * ==============================================================
 *
 * 1) There is always exactly one item selected. All executed commands
 *    operate on this item.
 *
 * 2) The app distinguishes three modes with respect to focus:
 *   2a) One of the UI panes has focus (inputs, buttons, selects).
 *       Keyboard shortcuts are disabled.
 *   2b) Current item is being edited. It is contentEditable and focused.
 *       Blurring ends the edit mode.
 *   2c) ELSE the Clipboard is focused (its invisible textarea)
 *
 * In 2a, we try to lose focus as soon as possible
 * (after clicking, after changing select's value), switching to 2c.
 *
 * 3) Editing mode (2b) can be ended by multiple ways:
 *   3a) By calling current.stopEditing();
 *       this shall be followed by some resolution.
 *   3b) By executing MM.Command.{Finish,Cancel};
 *       these call 3a internally.
 *   3c) By blurring the item itself (by selecting another);
 *       this calls MM.Command.Finish (3b).
 *   3b) By blurring the currentElement;
 *       this calls MM.Command.Finish (3b).
 *
 */
(MM as any).App = {
	init: function() {
		this.io = new MM.UI.IO();
	}
}

const port = document.querySelector<HTMLElement>("#port");
const throbber = document.querySelector<HTMLElement>("#throbber");
let fontSize = 100;

export let currentMap: Map;
export let currentItem: Item;
export let editing = false;

export function showMap(map: Map) {
	currentMap && currentMap.hide();

	history.reset();
	currentMap = map;
	currentMap.show(port);
}

export function action(action) {
	history.push(action);
	action.do();
}

export function selectItem(item: Item) {
	if (currentItem && currentItem != item) { currentItem.deselect(); }
	currentItem = item;
	currentItem.select();
}

export function adjustFontSize(diff: -1 | 1) {
	fontSize = Math.max(30, fontSize + 10*diff);
	port.style.fontSize = `${fontSize}%`;
	currentMap.update();
	currentMap.ensureItemVisibility(currentItem);
}

export function setThrobber(visible: boolean) {
	throbber.hidden = !visible;
}

export function startEditing() {
	editing = true;
	currentItem.startEditing();
}

export function stopEditing() {
	editing = false;
	return currentItem.stopEditing();
}

function init() {
	ui.init();
	clipboard.init();
	keyboard.init();
	menu.init(port);
	mouse.init(port);

	(MM as any).App.init();

	pubsub.subscribe("item-change", (_message: string, publisher: any) => {
		if (publisher.isRoot && publisher.map == currentMap) {
			document.title = currentMap.name + " :: My Mind";
		}
	});

	pubsub.subscribe("ui-change", syncPort);
	window.addEventListener("resize", syncPort);

	window.addEventListener("beforeunload", e => {
		e.preventDefault();
		return "";
	});

	window.addEventListener("load", e => {

		(MM as any).App.io.restore();
	});

	syncPort();
	showMap(new Map());
}

function syncPort() { // fixme k cemu?
	let portSize = [window.innerWidth - ui.getWidth(), window.innerHeight];
	port.style.width = portSize[0] + "px";
	port.style.height = portSize[1] + "px";
	throbber.style.right = (20 + ui.getWidth())+ "px";
	currentMap && currentMap.ensureItemVisibility(currentItem);
}

init();