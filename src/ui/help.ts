import { repo as commandRepo, Key } from "../command/command.js";


const node = document.querySelector<HTMLElement>("#help")!;
const MAP: Record<string, string> = {
	"Enter": "↩",
	"Space": "Spacebar",
	"ArrowLeft": "←",
	"ArrowUp": "↑",
	"ArrowRight": "→",
	"ArrowDown": "↓",
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
	if (key.key) {
		let ch = key.key;
		str += MAP[ch] || ch.toUpperCase();
	}
	if (key.code) {
		let code = key.code;
		if (code.startsWith("Key")) {
			str += code.substring(3);
		} else {
			str += MAP[code] || code;
		}
	}
	return str;
}

export function close() {
	node.hidden = true;
}
