import * as ui from "./ui/ui.js";


function handleEvent(e: KeyboardEvent) {
	/* mode 2a: ignore keyboard when the activeElement resides somewhere inside of the UI pane */
	if (ui.node.contains(document.activeElement)) { return; }

	let command = MM.Command.getAll().find(command => {
		if (!command.isValid()) { return false; }
		return command.keys.find(key => keyOK(key, e));
	});

	if (command) {
		command.prevent && e.preventDefault();
		command.execute(e);
	}
}

export function init() {
	window.addEventListener("keydown", handleEvent);
	window.addEventListener("keypress", handleEvent);
}

function keyOK(key, e: KeyboardEvent) {
	if ("keyCode" in key && e.type != "keydown") { return false; }
	if ("charCode" in key && e.type != "keypress") { return false; }
	for (let p in key) {
		if (key[p] != e[p]) { return false; }
	}
	return true;
}
