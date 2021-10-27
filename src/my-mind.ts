import "./mm.js";

import Map from "./map.js";
import Item from "./item.js";
import * as pubsub from "./pubsub.js";
import * as keyboard from "./keyboard.js";
import * as mouse from "./mouse.js";
import * as menu from "./menu.js";
import * as history from "./history.js";
import * as clipboard from "./clipboard.js";
import * as ui from "./ui/ui.js";

import { repo as commandRepo } from "./command/command.js";
import "./command/select.js";
import "./command/edit.js";


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
	if (currentItem && currentItem != item) {
		if (editing) { commandRepo.get("finish").execute(); }
		currentItem.deselect();
	}
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
