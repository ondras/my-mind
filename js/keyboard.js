MM.Keyboard = function() {
	window.addEventListener("keydown", this);
	window.addEventListener("keypress", this);
}

MM.Keyboard.prototype.handleEvent = function(e) {
	for (var i=0;i<MM.App.commands.length;i++) {
		var command = MM.App.commands[i];
		if (!command.isValid()) { continue; }
		var keys = command.getKeys();
		for (var j=0;j<keys.length;j++) {
			if (this._keyOK(keys[j], e)) {
				e.preventDefault();
				command.execute();
				return;
			}
		}
	}
}

MM.Keyboard.prototype._keyOK = function(key, e) {
	for (var p in key) {
		if (key[p] != e[p]) { return false; }
	}
	return true;
}

MM.Keyboard.prototype._handleKeyDown = function(e) {
	switch (e.keyCode) {
		case 37: /* left */
		break;
		case 38: /* top */
		break;
		case 39: /* right */
		break;
		case 40: /* bottom */
		break;
		
		case 45: /* insert */
		break;

		case 46: /* delete */
		break;
	}
}
