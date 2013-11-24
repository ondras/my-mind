MM.App = {
	commands: [],
	keyboard: null,
	current: null,
	editing: false,
	history: [],
	historyIndex: 0,
	map: null,
	
	action: function(action) {
		if (this.historyIndex < this.history.length) { /* remove undoed actions */
			this.history.splice(this.historyIndex, this.history.length-this.historyIndex);
		}
		
		this.history.push(action);
		this.historyIndex++;
		
		action.perform();
		return this;
	},
	
	setMap: function(map) {
		this.map = map;
		this.map.build(document.body);
		this.select(map.getRoot());
	},
	
	select: function(item) {
		if (this.current) {
			this.current.getNode().classList.remove("current");
		}
		this.current = item;
		this.current.getNode().classList.add("current");
	},
	
	init: function() {
		this.keyboard = new MM.Keyboard();
		for (var p in MM.Command) { this.commands.push(new MM.Command[p]()); }
	}
}
