MM.UI.Help = function() {
	this._node = document.querySelector("#help");
	this._map = {
		13: "↩",
		32: "Spacebar",
		36: "Home",
		37: "←",
		38: "↑",
		39: "→",
		40: "↓",
		45: "Insert",
		46: "Delete",
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
	this._buildRow(t, "Select");
	this._buildRow(t, "SelectRoot");
	this._buildRow(t, "Center");
	this._buildRow(t, "ZoomIn");
	this._buildRow(t, "ZoomOut");

	var t = this._node.querySelector(".manipulation");
	this._buildRow(t, "InsertSibling");
	this._buildRow(t, "InsertChild");
	this._buildRow(t, "Delete");

	var t = this._node.querySelector(".editing");
	this._buildRow(t, "Edit");
	this._buildRow(t, "Newline");

	var t = this._node.querySelector(".other");
	this._buildRow(t, "Undo");
	this._buildRow(t, "Redo");
	this._buildRow(t, "Save");
	this._buildRow(t, "SaveAs");
	this._buildRow(t, "Load");
	this._buildRow(t, "Help");
}

MM.UI.Help.prototype._buildRow = function(table, commandName) {
	var command = MM.Command[commandName];
	var row = table.insertRow(-1);

	var keys = command.keys.map(this._formatKey, this);
	row.insertCell().innerHTML = command.label;
	row.insertCell().innerHTML = keys.join("/");
}

MM.UI.Help.prototype._formatKey = function(key) {
	var str = "";
	if (key.ctrlKey) { str += "Ctrl+"; }
	if (key.altKey) { str += "Alt+"; }
	if (key.charCode) { 
		var ch = String.fromCharCode(key.charCode).toUpperCase();
		str += this._map[ch] || ch; 
	}
	if (key.keyCode) { str += this._map[key.keyCode] || key.keyCode; }
	return str;
}
