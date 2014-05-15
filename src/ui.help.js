MM.UI.Help = function() {
	this._node = document.querySelector("#help");
	this._map = {
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
	};
	
	this._build();
}

MM.UI.Help.prototype.toggle = function() {
	this._node.classList.toggle("visible");
}

MM.UI.Help.prototype._build = function() {
	var t = this._node.querySelector(".navigation");
	this._buildRow(t, "Pan");
	this._buildRow(t, "Select");
	this._buildRow(t, "SelectRoot");
	this._buildRow(t, "SelectParent");
	this._buildRow(t, "Center");
	this._buildRow(t, "ZoomIn", "ZoomOut");
	this._buildRow(t, "Fold");

	var t = this._node.querySelector(".manipulation");
	this._buildRow(t, "InsertSibling");
	this._buildRow(t, "InsertChild");
	this._buildRow(t, "Swap");
	this._buildRow(t, "Side");
	this._buildRow(t, "Delete");

	this._buildRow(t, "Copy");
	this._buildRow(t, "Cut");
	this._buildRow(t, "Paste");

	var t = this._node.querySelector(".editing");
	this._buildRow(t, "Value");
	this._buildRow(t, "Yes", "No", "Computed");
	this._buildRow(t, "Edit");
	this._buildRow(t, "Newline");
	this._buildRow(t, "Bold");
	this._buildRow(t, "Italic");
	this._buildRow(t, "Underline");
	this._buildRow(t, "Strikethrough");

	var t = this._node.querySelector(".other");
	this._buildRow(t, "Undo", "Redo");
	this._buildRow(t, "Save");
	this._buildRow(t, "SaveAs");
	this._buildRow(t, "Load");
	this._buildRow(t, "Help");
	this._buildRow(t, "UI");
}

MM.UI.Help.prototype._buildRow = function(table, commandName) {
	var row = table.insertRow(-1);

	var labels = [];
	var keys = [];

	for (var i=1;i<arguments.length;i++) {
		var command = MM.Command[arguments[i]];
		labels.push(command.label);
		keys = keys.concat(command.keys.map(this._formatKey, this));
	}

	row.insertCell(-1).innerHTML = labels.join("/");
	row.insertCell(-1).innerHTML = keys.join("/");

}

MM.UI.Help.prototype._formatKey = function(key) {
	var str = "";
	if (key.ctrlKey) { str += "Ctrl+"; }
	if (key.altKey) { str += "Alt+"; }
	if (key.shiftKey) { str += "Shift+"; }
	if (key.charCode) { 
		var ch = String.fromCharCode(key.charCode);
		str += this._map[ch] || ch.toUpperCase(); 
	}
	if (key.keyCode) { str += this._map[key.keyCode] || String.fromCharCode(key.keyCode); }
	return str;
}
