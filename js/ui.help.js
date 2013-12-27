MM.UI.Help = function() {
	this._node = document.querySelector("#help");
	this._map = {
		13: "Enter",
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
		121: "F10"
	};
	
	this._build();
}

MM.UI.Help.prototype.toggle = function() {
	this._node.classList.toggle("visible");
}

MM.UI.Help.prototype._build = function() {
	var table = document.createElement("table");
	
	for (var p in MM.Command) {
		var c = MM.Command[p];
		if (!c.label) { continue; }
		this._buildRow(c, table);
	}

	this._node.appendChild(table);
}

MM.UI.Help.prototype._buildRow = function(command, table) {
	var row = table.insertRow(-1);

	var keys = command.keys.map(this._formatKey, this);
	row.insertCell().innerHTML = command.label;
	row.insertCell().innerHTML = keys.join("/");
}

MM.UI.Help.prototype._formatKey = function(key) {
	var str = "";
	if (key.ctrlKey) { str += "Ctrl+"; }
	if (key.altKey) { str += "Alt+"; }
	if (key.charCode) { str += String.fromCharCode(key.charCode).toUpperCase(); }
	if (key.keyCode) { str += this._map[key.keyCode] || key.keyCode; }
	return str;
}
