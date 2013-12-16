MM.Keyboard = function() {
	window.addEventListener("keydown", this);
	window.addEventListener("keypress", this);
}

MM.Keyboard.prototype.handleEvent = function(e) {
	MM.Command.ALL.some(function(name) {
		var command = MM.Command[name];
		if (!command.isValid()) { return; }
		var keys = command.keys;
		for (var i=0;i<keys.length;i++) {
			if (this._keyOK(keys[i], e)) {
				e.preventDefault();
				command.execute(e);
				return true;
			}
		}
		return false;
	}, this);
}

MM.Keyboard.prototype._keyOK = function(key, e) {
	if ("keyCode" in key && e.type != "keydown") { return false; }
	if ("charCode" in key && e.type != "keypress") { return false; }
	for (var p in key) {
		if (key[p] != e[p]) { return false; }
	}
	return true;
}
