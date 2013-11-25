MM.Command.Help = function() {
	MM.Command.call(this);

	this._name = "Show/hide help";
	this._keys.push({charCode: "?".charCodeAt(0)});
	this._node = document.createElement("div"),
	this._node.id = "help";
	document.body.appendChild(this._node)
}
MM.Command.Help.prototype = Object.create(MM.Command.prototype);

MM.Command.Help.prototype.execute = function() {
	if (!this._node.firstChild) { this._build(); }
	this._node.classList.toggle("visible");
}

MM.Command.Help.prototype._build = function() {
	var all = MM.App.commands;
	var table = document.createElement("table");

	for (var i=0;i<all.length;i++) {
		var c = all[i];
		var name = c.getName();
		if (!name) { continue; }
		this._buildRow(c, table);
	}

	this._node.appendChild(table);
}

MM.Command.Help.prototype._buildRow = function(command, table) {
	var name = command.getName();
	if (!name) { return; }
	var row = table.insertRow(-1);

	var keys = command.getKeys().map(this._formatKey, this);
	row.insertCell().innerHTML = name;
	row.insertCell().innerHTML = keys.join("/");
}

MM.Command.Help.prototype._formatKey = function(key) {
	return "asd";
}
