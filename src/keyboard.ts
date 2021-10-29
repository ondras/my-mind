import * as ui from "./ui/ui.js";
import { repo as commandRepo, Key } from "./command/command.js";


type EventProp = keyof KeyboardEvent;

function handleEvent(e: KeyboardEvent) {
	// ignore keyboard when the activeElement resides somewhere inside of the UI pane
	if (ui.isActive()) { return; }

	let command = [...commandRepo.values()].find(command => {
		if (!command.isValid) { return false; }
		return command.keys.find(key => keyOK(key, e));
	});

	if (command) {
		e.preventDefault();
		command.execute(e);
	}
}

export function init() {
	window.addEventListener("keydown", handleEvent);
}

function keyOK(key: Key, e: KeyboardEvent) {
	return Object.entries(key).every(([key, value]) => e[key as EventProp] == value);
}
