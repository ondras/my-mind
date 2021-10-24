import * as app from "../my-mind.js";
import * as clipboard from "../clipboard.js";


const node = document.querySelector("#notes") as HTMLElement;

export function toggle() {
	node.hidden = !node.hidden;
}

export function close() {
	if (!node.hidden) {
		node.hidden = true;
		clipboard.focus();
	}
}

export function update(html) {
	if (html.trim().length === 0) {
		app.currentItem.notes = null;
	} else {
		app.currentItem.notes = html;
	}
	app.currentItem.update();
}
