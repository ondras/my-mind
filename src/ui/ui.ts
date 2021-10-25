import * as clipboard from "../clipboard.js";
import * as pubsub from "../pubsub.js";
import * as app from "../my-mind.js";

import * as color from "./color.js";
import * as value from "./value.js";
import * as layout from "./layout.js";
import * as icon from "./icon.js";
import * as shape from "./shape.js";
import * as status from "./status.js";

import * as help from "./help.js";
import * as notes from "./notes.js";
import * as tip from "./tip.js";


const node = document.querySelector<HTMLElement>(".ui");

(MM as any).UI = {};

export function isActive() {
	return node.contains(document.activeElement);
}

export function toggle() {
	node.hidden = !node.hidden;
	pubsub.publish("ui-change", this);
}

export function getWidth() {
	return (node.hidden ? 0 : node.offsetWidth);
}

function update() {
	[layout, shape, icon, value, status].forEach(ui => ui.update());
}

function onClick(e: MouseEvent) {
	let target = e.target as HTMLElement;

	if (target.nodeName.toLowerCase() != "select") { clipboard.focus(); } // focus the clipboard (2c)

	if (target == node.querySelector("#toggle")) { // fixme nelibi
		toggle();
		return;
	}

	let current: Node = target;
	while (current != document) {
		let command = (current as HTMLElement).dataset.command;
		if (command) {
			MM.Command[command].execute();
			return;
		}
		current = current.parentNode;
	}
}

export function init() {
	[
		layout, shape, icon, value, status, color,
		help, tip, notes
	].forEach(ui => ui.init());

	pubsub.subscribe("item-select", update);
	pubsub.subscribe("item-change", (_message: string, publisher: any) => {
		if (publisher == app.currentItem) { update(); }
	});

	node.addEventListener("click", onClick);
	node.addEventListener("change", _ => clipboard.focus()); // focus the clipboard (2c)
}
