MM.Keyboard = {};
MM.Keyboard.init = function() {
	window.addEventListener("keydown", this);
	window.addEventListener("keypress", this);
}

MM.Keyboard.handleEvent = function(e) {
	/* mode 2a: ignore keyboard when the activeElement resides somewhere inside of the UI pane */
	var node = document.activeElement;
	while (node && node != document) {
		if (node.classList.contains("ui")) { return; }
		node = node.parentNode;
	}
	
	var commands = MM.Command.getAll();
	for (var i=0;i<commands.length;i++) {
		var command = commands[i];
		if (!command.isValid()) { continue; }
		var keys = command.keys;
		for (var j=0;j<keys.length;j++) {
			if (this._keyOK(keys[j], e)) {
				command.prevent && e.preventDefault();
				command.execute(e);
				return;
			}
		}
	}
}

MM.Keyboard._keyOK = function(key, e) {
	if ("keyCode" in key && e.type != "keydown") { return false; }
	if ("charCode" in key && e.type != "keypress") { return false; }
	for (var p in key) {
		if (key[p] != e[p]) { return false; }
	}
	return true;
}
