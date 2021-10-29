import * as actions from "../action.js";
import * as app from "../my-mind.js";
import { repo as commandRepo } from "../command/command.js";


const select = document.querySelector<HTMLSelectElement>("#value")!;

export function init() {
	select.addEventListener("change", onChange);
}

export function update() {
	let value = app.currentItem.value;
	if (value === null) { value = ""; }
	if (typeof(value) == "number") { value = "num"; }

	select.value = value;
}

function onChange() {
	let value = select.value;
	if (value == "num") {
		commandRepo.get("value")!.execute();
	} else {
		let action = new actions.SetValue(app.currentItem, value || null);
		app.action(action);
	}
}
