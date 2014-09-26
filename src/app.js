/*
setInterval(function() {
	console.log(document.activeElement);
}, 1000);
*/

/*
 * Notes regarding app state/modes, activeElements, focusing etc.
 * ==============================================================
 * 
 * 1) There is always exactly one item selected. All executed commands 
 *    operate on this item.
 * 
 * 2) The app distinguishes three modes with respect to focus:
 *   2a) One of the UI panes has focus (inputs, buttons, selects). 
 *       Keyboard shortcuts are disabled.
 *   2b) Current item is being edited. It is contentEditable and focused. 
 *       Blurring ends the edit mode.
 *   2c) ELSE the Clipboard is focused (its invisible textarea)
 * 
 * In 2a, we try to lose focus as soon as possible
 * (after clicking, after changing select's value), switching to 2c.
 *
 * 3) Editing mode (2b) can be ended by multiple ways:
 *   3a) By calling current.stopEditing();
 *       this shall be followed by some resolution.
 *   3b) By executing MM.Command.{Finish,Cancel};
 *       these call 3a internally.
 *   3c) By blurring the item itself (by selecting another);
 *       this calls MM.Command.Finish (3b).
 *   3b) By blurring the currentElement;
 *       this calls MM.Command.Finish (3b).
 * 
 */
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
		if (this.current && this.current != item) { this.current.deselect(); }
		this.current = item;
		this.current.select();
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
		MM.Menu.init(this._port);
		MM.Mouse.init(this._port);
		MM.Clipboard.init();

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
