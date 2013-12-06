MM.App = {
	commands: [],
	keyboard: null,
	current: null,
	editing: false,
	history: [],
	historyIndex: 0,
	map: null,
	_port: null,
	
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
		this.map.show(this._port);
		this.select(map.getRoot());
	},
	
	select: function(item) {
		if (this.current) {
			this.current.getDOM().node.classList.remove("current");
		}
		this.current = item;
		this.current.getDOM().node.classList.add("current");
		this.map.ensureItemVisibility(item);
	},

	handleEvent: function(e) {
		switch (e.type) {
			case "resize":
				this._syncPort();
			break;

			case "click":
				var node = e.target;
				while (node != this._port) {
					if (node.classList.contains("text")) {
						this.select(this.map.getItemFor(node));
						return;
					}
					node = node.parentNode;
				}
			break;
		} /* switch */
	},
	
	init: function() {
		this._port = document.querySelector("#port");
		this.keyboard = new MM.Keyboard();
		for (var p in MM.Command) { this.commands.push(new MM.Command[p]()); }

		this._port.addEventListener("click", this);
		window.addEventListener("resize", this);

		this._syncPort();
	},

	_syncPort: function() {
		this._port.style.width = window.innerWidth + "px";
		this._port.style.height = window.innerHeight + "px";
	}
}
