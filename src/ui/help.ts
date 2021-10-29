import { repo as commandRepo, Key } from "../command/command.js";


const node = document.querySelector<HTMLElement>("#help")!;
const MAP: Record<number | string, string> = {
	8: "Backspace",
	9: "Tab",
	13: "↩",
	32: "Spacebar",
	33: "PgUp",
	34: "PgDown",
	35: "End",
	36: "Home",
	37: "←",
	38: "↑",
	39: "→",
	40: "↓",
	45: "Insert",
	46: "Delete",
	65: "A",
	68: "D",
	83: "S",
	87: "W",
	112: "F1",
	113: "F2",
	114: "F3",
	115: "F4",
	116: "F5",
	117: "F6",
	118: "F7",
	119: "F8",
	120: "F9",
	121: "F10",
	"-": "−"
}

export function toggle() {
	node.hidden = !node.hidden;
}

export function init() {
	let t = node.querySelector<HTMLTableElement>(".navigation")!;
	buildRow(t, "pan");
	buildRow(t, "select");
	buildRow(t, "select-root");
	buildRow(t, "select-parent");
	buildRow(t, "center");
	buildRow(t, "zoom-in", "zoom-out");
	buildRow(t, "fold");

	t = node.querySelector(".manipulation")!;
	buildRow(t, "insert-sibling");
	buildRow(t, "insert-child");
	buildRow(t, "swap");
	buildRow(t, "side");
	buildRow(t, "delete");

	t = node.querySelector(".editing")!;
	buildRow(t, "value");
	buildRow(t, "yes", "no", "computed");
	buildRow(t, "edit");
	buildRow(t, "newline");
	buildRow(t, "bold");
	buildRow(t, "italic");
	buildRow(t, "underline");
	buildRow(t, "strikethrough");

	t = node.querySelector(".other")!;
	buildRow(t, "undo", "redo");
	buildRow(t, "save");
	buildRow(t, "save-as");
	buildRow(t, "load");
	buildRow(t, "help");
	buildRow(t, "notes");
	buildRow(t, "ui");
}

function buildRow(table: HTMLTableElement, ...commandNames: string[]) {
	var row = table.insertRow(-1);

	let labels: string[] = [];
	let keys: string[] = [];

	commandNames.forEach(name => {
		let command = commandRepo.get(name);
		if (!command) { console.warn(name); return; }
		labels.push(command.label);
		keys = keys.concat(command.keys.map(formatKey));
	});

	row.insertCell(-1).textContent = labels.join("/");
	row.insertCell(-1).textContent = keys.join("/");
}

function formatKey(key: Key) {
	var str = "";
	if (key.ctrlKey) { str += "Ctrl+"; }
	if (key.altKey) { str += "Alt+"; }
	if (key.shiftKey) { str += "Shift+"; }
	if (key.charCode) {
		var ch = String.fromCharCode(key.charCode);
		str += MAP[ch] || ch.toUpperCase();
	}
	if (key.keyCode) { str += MAP[key.keyCode] || String.fromCharCode(key.keyCode); }
	return str;
}

export function close() {
	node.hidden = true;
}
