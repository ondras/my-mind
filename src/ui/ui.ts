import * as pubsub from "../pubsub.js";
import * as app from "../my-mind.js";

import * as color from "./color.js";
import * as textColor from "./text-color.js";
import * as value from "./value.js";
import * as layout from "./layout.js";
import * as icon from "./icon.js";
import * as shape from "./shape.js";
import * as status from "./status.js";

import * as help from "./help.js";
import * as notes from "./notes.js";
import * as tip from "./tip.js";
import * as io from "./io.js";
import * as menu from "./context-menu.js";
import { repo as commandRepo } from "../command/command.js";


const node = document.querySelector<HTMLElement>("#ui")!;

export function isActive() {
	return node.contains(document.activeElement) || io.isActive();
}

export function toggle() {
	node.hidden = !node.hidden;
	pubsub.publish("ui-change");
}

export function getWidth() {
	return (node.hidden ? 0 : node.offsetWidth);
}

function update() {
	[layout, shape, icon, value, status].forEach(ui => ui.update());
}

function onClick(e: MouseEvent) {
	let target = e.target as HTMLElement;

	if (target == node.querySelector("#toggle")) { // fixme nelibi
		toggle();
		return;
	}

	let current: Element = target;
	while (true) {
		let command = (current as HTMLElement).dataset.command;
		if (command) {
			commandRepo.get(command)!.execute();
			return;
		}
		if (current.parentNode instanceof Element) {
			current = current.parentNode;
		} else {
			return;
		}
	}
}

export function init(port: HTMLElement) {
	[layout, shape, icon, value, status, color, textColor,
	help, tip, notes, io].forEach(ui => ui.init());
	menu.init(port);

	pubsub.subscribe("item-select", update);
	pubsub.subscribe("item-change", (_message: string, publisher: any) => {
		if (publisher == app.currentItem) { update(); }
	});

	node.addEventListener("click", onClick);

	io.restore();
}
