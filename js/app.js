MM.App = {
	keyboard: null,
	current: null,
	editing: false,
	history: [],
	historyIndex: 0,
	map: null,
	ui: null,
	_port: null,
	_mouse: [0, 0],
	_fontSize: 100,
	
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

		this.history = [];
		this.historyIndex = 0;

		this.map = map;
		
		if (this.map) {
			this.map.show(this._port);
			this.select(map.getRoot());
			MM.publish("map-change", map);
		}
	},
	
	select: function(item) {
		if (this.current) {
			this.current.getDOM().node.classList.remove("current");
		}
		this.current = item;
		this.current.getDOM().node.classList.add("current");
		this.map.ensureItemVisibility(item);
		MM.publish("item-select", item);
	},
	
	adjustFontSize: function(diff) {
		this._fontSize = Math.max(30, this._fontSize + 10*diff);
		this._port.style.fontSize = this._fontSize + "%";
		this.map.getRoot().updateSubtree();
		this.map.moveBy(0, 0);
	},
	
	handleMessage: function(message, publisher) {
		switch (message) {
			case "ui-change":
				this._syncPort();
			break;
		}
	},

	handleEvent: function(e) {
		switch (e.type) {
			case "resize":
				this._syncPort();
			break;

			case "click":
				if (!this.map) { return; }
				var item = this.map.getItemFor(e.target);
				if (item) { this.select(item); }
			break;
			
			case "mousedown":
				if (!this.map) { return; }
				var item = this.map.getItemFor(e.target);
				if (item) { return; }
				this._port.style.cursor = "move";
				this._port.addEventListener("mousemove", this);
				this._port.addEventListener("mouseup", this);
				this._mouse[0] = e.clientX;
				this._mouse[1] = e.clientY;
			break;
			
			case "mousemove":
				this.map.moveBy(e.clientX-this._mouse[0], e.clientY-this._mouse[1]);
				this._mouse[0] = e.clientX;
				this._mouse[1] = e.clientY;
			break;
			
			case "mouseup":
				this._port.style.cursor = "";
				this._port.removeEventListener("mousemove", this);
				this._port.removeEventListener("mouseup", this);
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
			"Help", "Center", "ZoomIn", "ZoomOut",
			"New", "Save", "Load", "SaveAs"
		];
		MM.Command.ALL.forEach(function(name) {
			MM.Command[name].init();
		});

		MM.subscribe("ui-change", this);
		this._port.addEventListener("mousedown", this);
		this._port.addEventListener("click", this);
		window.addEventListener("resize", this);

		this._syncPort();
	},

	_syncPort: function() {
		this._port.style.width = (window.innerWidth - this.ui.getWidth()) + "px";
		this._port.style.height = window.innerHeight + "px";
		if (this.map) { this.map.moveBy(0, 0); }
	}
}
