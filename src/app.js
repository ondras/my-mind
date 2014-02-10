MM.App = {
	keyboard: null,
	current: null,
	editing: false,
	history: [],
	historyIndex: 0,
	portSize: [0, 0],
	map: null,
	ui: null,
	io: null,
	help: null,
	_port: null,
	_throbber: null,
	_drag: {
		pos: [0, 0],
		item: null,
		ghost: null
	},
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
		this.map.show(this._port);
	},
	
	select: function(item) {
		if (item == this.current) { return; }

		if (this.editing) { MM.Command.Finish.execute(); }

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
		this.map.update();
		this.map.ensureItemVisibility(this.current);
	},
	
	handleMessage: function(message, publisher) {
		switch (message) {
			case "ui-change":
				this._syncPort();
			break;

			case "item-change":
				if (publisher.isRoot() && publisher.getMap() == this.map) {
					document.title = this.map.getName() + " :: My Mind";
				}
			break;
		}
	},

	handleEvent: function(e) {
		switch (e.type) {
			case "resize":
				this._syncPort();
			break;

			case "beforeunload":
				e.preventDefault();
				return "";
			break;
		}
	},
	
	setThrobber: function(visible) {
		this._throbber.classList[visible ? "add" : "remove"]("visible");
	},

	init: function() {
		this._port = document.querySelector("#port");
		this._throbber = document.querySelector("#throbber");
		this.ui = new MM.UI();
		this.io = new MM.UI.IO();
		this.help = new MM.UI.Help();

		MM.Tip.init();
		MM.Keyboard.init();
		MM.Mouse.init(this._port);

		window.addEventListener("resize", this);
		window.addEventListener("beforeunload", this);
		MM.subscribe("ui-change", this);
		MM.subscribe("item-change", this);
		
		this._syncPort();
		this.setMap(new MM.Map());
	},

	_syncPort: function() {
		this.portSize = [window.innerWidth - this.ui.getWidth(), window.innerHeight];
		this._port.style.width = this.portSize[0] + "px";
		this._port.style.height = this.portSize[1] + "px";
		this._throbber.style.right = (20 + this.ui.getWidth())+ "px";
		if (this.map) { this.map.ensureItemVisibility(this.current); }
	}
}
