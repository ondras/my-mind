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
		if (this.map) { this.map.hide(); }
		this.map = map;
		this.map.show(document.body);
		this.select(map.getRoot());
	},
	
	select: function(item) {
		if (this.current) {
			this.current.getDOM().node.classList.remove("current");
		}
		this.current = item;
		this.current.getDOM().node.classList.add("current");
	},
	
	init: function() {
		this.keyboard = new MM.Keyboard();
		this.layout = new MM.Layout();
		for (var p in MM.Command) { this.commands.push(new MM.Command[p]()); }
	}
}
