import * as app from "../my-mind.js";
import * as clipboard from "../clipboard.js";


const node = document.querySelector<HTMLElement>("#notes");

export function toggle() {
	node.hidden = !node.hidden;
}

export function close() {
	if (node.hidden) { return ; }
	node.hidden = true;
	clipboard.focus();
}

function update(html: string) {
	if (html.trim().length === 0) {
		app.currentItem.notes = null;
	} else {
		app.currentItem.notes = html;
	}
	app.currentItem.update();
}

function onMessage(e: MessageEvent) {
	if (!e.data || !e.data.action) { return; }
	switch (e.data.action) {
		case "setContent": update(e.data.value); break;
		case "closeEditor": close(); break;
	}
}

export function init() {
	window.addEventListener("message", onMessage);
}
