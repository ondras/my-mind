MM.App = {
	keyboard: null,
	current: null,
	editing: false,
	history: [],
	historyIndex: 0,
	map: null,
	ui: null,
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
		this.ui.update();
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
		this.ui = new MM.UI();
		this.keyboard = new MM.Keyboard();

		MM.Command.ALL = [
			"Select", "SelectRoot",
			"InsertChild", "InsertSibling", "Delete",
			"Undo", "Redo",
			"Edit", "Newline", "Cancel", "Finish",
			"Help", "Center",
			"Save", "Load"
		];
		MM.Command.ALL.forEach(function(name) {
			MM.Command[name].init();
		});

		this._port.addEventListener("click", this);
		window.addEventListener("resize", this);

		this._syncPort();
	},

	_syncPort: function() {
		this._port.style.width = (window.innerWidth - this.ui.getWidth()) + "px";
		this._port.style.height = window.innerHeight + "px";
	}
}
