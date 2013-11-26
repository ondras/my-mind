MM.App = {
	commands: [],
	keyboard: null,
	current: null,
	editing: false,
	history: [],
	historyIndex: 0,
	map: null,
	layout: null,
	
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
	
	setLayout: function(layoutCtor) {
		if (this.layout) { this.layout.destroy(); }
		this.layout = new layoutCtor();
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
