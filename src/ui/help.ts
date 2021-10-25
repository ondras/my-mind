const node = document.querySelector<HTMLElement>("#help");
const MAP = {
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
	"-": "&minus;"
}

export function toggle() {
	node.hidden = !node.hidden;
}

export function init() {
	let t = node.querySelector<HTMLTableElement>(".navigation");
	buildRow(t, "Pan");
	buildRow(t, "Select");
	buildRow(t, "SelectRoot");
	buildRow(t, "SelectParent");
	buildRow(t, "Center");
	buildRow(t, "ZoomIn", "ZoomOut");
	buildRow(t, "Fold");

	t = node.querySelector(".manipulation");
	buildRow(t, "InsertSibling");
	buildRow(t, "InsertChild");
	buildRow(t, "Swap");
	buildRow(t, "Side");
	buildRow(t, "Delete");

	buildRow(t, "Copy");
	buildRow(t, "Cut");
	buildRow(t, "Paste");

	t = node.querySelector(".editing");
	buildRow(t, "Value");
	buildRow(t, "Yes", "No", "Computed");
	buildRow(t, "Edit");
	buildRow(t, "Newline");
	buildRow(t, "Bold");
	buildRow(t, "Italic");
	buildRow(t, "Underline");
	buildRow(t, "Strikethrough");

	t = node.querySelector(".other");
	buildRow(t, "Undo", "Redo");
	buildRow(t, "Save");
	buildRow(t, "SaveAs");
	buildRow(t, "Load");
	buildRow(t, "Help");
	buildRow(t, "Notes");
	buildRow(t, "UI");
}

function buildRow(table: HTMLTableElement, ...commandNames: string[]) {
	var row = table.insertRow(-1);

	var labels = [];
	var keys = [];

	commandNames.forEach(name => {
		let command = MM.Command[name];
		if (!command) { return; }
		labels.push(command.label);
		keys = keys.concat(command.keys.map(formatKey));
	});

	row.insertCell(-1).textContent = labels.join("/");
	row.insertCell(-1).textContent = keys.join("/");
}

function formatKey(key) {
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
