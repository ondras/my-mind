MM.App = {
	commands: [],
	keyboard: null,
	selection: null,
	editing: null,
	history: [],
	historyIndex: 0,
	
	action: function(action) {
		if (this.historyIndex < this.history.length) { /* remove undoed actions */
			this.history.splice(this.historyIndex, this.history.length-this.historyIndex);
		}
		
		this.history.push(action);
		this.historyIndex++;
		
		action.perform();
		return this;
	},
	
	init: function() {
		this.keyboard = new MM.Keyboard();
		this.selection = new MM.Selection();
		for (var p in MM.Command) { this.commands.push(new MM.Command[p]()); }
	}
}
