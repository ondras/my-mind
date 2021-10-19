import "./mm.js";
import "./promise.js";
import "./repo.js";
import "./map.js";
import "./keyboard.js";
import "./tip.js";
import "./action.js";
import "./clipboard.js";
import "./menu.js";
import "./command/command.js";
import "./command/command.edit.js";
import "./command/command.select.js";
import "./layout/layout.js";
import "./layout/layout.graph.js";
import "./layout/layout.tree.js";
import "./layout/layout.map.js";
import "./shape/shape.box.js";
import "./shape/shape.ellipse.js";
import "./shape/shape.underline.js";
import "./format/format.js";
import "./format/format.json.js";
import "./format/format.freemind.js";
import "./format/format.mma.js";
import "./format/format.mup.js";
import "./format/format.plaintext.js";
import "./backend/backend.js";
import "./backend/backend.local.js";
import "./backend/backend.webdav.js";
import "./backend/backend.image.js";
import "./backend/backend.file.js";
import "./backend/backend.firebase.js";
import "./backend/backend.gdrive.js";
import "./ui/ui.js";
import "./ui/ui.layout.js";
import "./ui/ui.shape.js";
import "./ui/ui.value.js";
import "./ui/ui.status.js";
import "./ui/ui.color.js";
import "./ui/ui.icon.js";
import "./ui/ui.help.js";
import "./ui/ui.notes.js";
import "./ui/ui.io.js";
import "./ui/backend/ui.backend.js";
import "./ui/backend/ui.backend.file.js";
import "./ui/backend/ui.backend.webdav.js";
import "./ui/backend/ui.backend.image.js";
import "./ui/backend/ui.backend.local.js";
import "./ui/backend/ui.backend.firebase.js";
import "./ui/backend/ui.backend.gdrive.js";
import "./mouse.js";

import * as pubsub from "./pubsub.js";


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
				if (publisher.isRoot() && publisher.map == this.map) {
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

			case "keyup":
				if (e.key === "Escape") {
					MM.App.notes.close();
					MM.App.help.close();
				}
				break;

			case "message":
				if (e.data && e.data.action) {
					switch (e.data.action) {
						case "setContent":
							MM.App.notes.update(e.data.value);
							break;

						case "closeEditor":
							MM.App.notes.close();
							break;
					}
				}

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
		this.notes = new MM.UI.Notes();

		MM.Tip.init();
		MM.Keyboard.init();
		MM.Menu.init(this._port);
		MM.Mouse.init(this._port);
		MM.Clipboard.init();

		window.addEventListener("resize", this);
		window.addEventListener("beforeunload", this);
		window.addEventListener("keyup", this);
		window.addEventListener("message", this, false);
		pubsub.subscribe("ui-change", this);
		pubsub.subscribe("item-change", this);

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
