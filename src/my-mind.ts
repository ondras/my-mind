import Map, { init as initMap } from "./map.js";
import Item from "./item.js";
import Action from "./action.js";
import * as pubsub from "./pubsub.js";
import * as keyboard from "./keyboard.js";
import * as mouse from "./mouse.js";
import * as history from "./history.js";
import * as clipboard from "./clipboard.js";
import * as title from "./title.js";
import * as ui from "./ui/ui.js";

import { repo as commandRepo } from "./command/command.js";
import "./command/select.js";
import "./command/edit.js";


const port = document.querySelector<HTMLElement>("main")!;
const throbber = document.querySelector<HTMLElement>("#throbber")!;

export let currentMap: Map;
export let currentItem: Item;
export let editing = false;

export function showMap(map: Map) {
	currentMap && currentMap.hide();

	history.reset();
	currentMap = map;
	currentMap.show(port);
}

export function action(action: Action) {
	history.push(action);
	action.do();
}

export function selectItem(item: Item) {
	if (currentItem && currentItem != item) {
		if (editing) { commandRepo.get("finish")!.execute(); }
		currentItem.deselect();
	}
	currentItem = item;
	currentItem.select();
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

async function init() {
	await initMap();

	pubsub.subscribe("ui-change", syncPort);
	window.addEventListener("resize", syncPort);

	window.addEventListener("beforeunload", e => {
		e.preventDefault();
		return "";
	});

	clipboard.init();
	keyboard.init();
	mouse.init(port);
	title.init();
	ui.init(port);

	syncPort();
	showMap(new Map());
}

function syncPort() { // fixme k cemu?
	let portSize = [window.innerWidth - ui.getWidth(), window.innerHeight];
	port.style.width = portSize[0] + "px";
	port.style.height = portSize[1] + "px";
	currentMap && currentMap.ensureItemVisibility(currentItem);
}

init();
