MM.App = function() {
	this._keyboard = new MM.Keyboard(this);
	this._selection = new MM.Selection();
	this._history = [];
	this._historyIndex = 0; /* points _after_ last action performed */
}

MM.App.prototype.getSelection = function() {
	return this._selection;
}

MM.App.prototype.action = function(action) {
	if (this._historyIndex < this._history.length) { /* remove undoed actions */
		this._history.splice(this._historyIndex, this._history.length-this._historyIndex);
	}
	
	this._history.push(action);
	this._historyIndex++;
	action.perform();
}

MM.App.prototype.undo = function() {
	if (!this._historyIndex) { return; }
	this._history[this._historyIndex-1].undo();
	this._historyIndex--;
}

MM.App.prototype.redo = function() {
	if (this._historyIndex == this._history.length) { return; }
	this._history[this._historyIndex].perform();
	this._historyIndex++;
	return this;
}
