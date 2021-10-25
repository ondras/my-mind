import * as clipboard from "../clipboard.js";
import * as pubsub from "../pubsub.js";
import * as app from "../my-mind.js";


const node = document.querySelector(".ui") as HTMLElement;

(MM as any).UI = {};

let layout, shape, icon, color, value, status;

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
		this.toggle();
		return;
	}

	let current: Node = target;
	while (current != document) {
		let command = node.dataset.command;
		if (command) {
			MM.Command[command].execute();
			return;
		}
		current = node.parentNode;
	}
}

export function init() {
	layout = new MM.UI.Layout();
	shape = new MM.UI.Shape();
	icon = new MM.UI.Icon();
	color = new MM.UI.Color();
	value = new MM.UI.Value();
	status = new MM.UI.Status();

	pubsub.subscribe("item-select", update);
	pubsub.subscribe("item-change", (_message: string, publisher: any) => {
		if (publisher == app.currentItem) { update(); }
	});

	node.addEventListener("click", onClick);
	node.addEventListener("change", _ => clipboard.focus()); // focus the clipboard (2c)
}
