import * as actions from "../action.js";
import * as app from "../my-mind.js";
import { Status } from "../item.js";


const select = document.querySelector<HTMLSelectElement>("#status");

const STATUS_MAP = {
	"yes": true,
	"no": false,
	"": null
}

function statusToString(status: Status) {
	for (let key in STATUS_MAP) {
		if (STATUS_MAP[key] === status) { return key; }
	}
	return String(status);
}

function stringToStatus(str: string) {
	return (str in STATUS_MAP ? STATUS_MAP[str] : str);
}

export function init() {
	select.addEventListener("change", onChange);
}

export function update() {
	select.value = statusToString(app.currentItem.status);
}

function onChange() {
	let status = stringToStatus(select.value);
	let action = new actions.SetStatus(app.currentItem, status);
	app.action(action);
}
