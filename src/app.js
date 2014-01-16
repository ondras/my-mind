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
		mouse: [0, 0],
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
		document.activeElement.blur();
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

			case "click":
				var item = this.map.getItemFor(e.target);
				if (item) { this.select(item); }
			break;
			
			case "dblclick":
				var item = this.map.getItemFor(e.target);
				if (item) { MM.Command.Edit.execute(); }
			break;
			
			case "mousedown":
				if (this.editing) { return; }
				e.preventDefault();
				this._port.addEventListener("mousemove", this);
				this._port.addEventListener("mouseup", this);
				this._drag.mouse[0] = e.clientX;
				this._drag.mouse[1] = e.clientY;

				var item = this.map.getItemFor(e.target);
				if (item && !item.isRoot()) { 
					this._drag.item = item;
				} else {
					this._port.style.cursor = "move";
				}
			break;
			
			case "mousemove":
				var dx = e.clientX - this._drag.mouse[0];
				var dy = e.clientY - this._drag.mouse[1];
				this._drag.mouse[0] = e.clientX;
				this._drag.mouse[1] = e.clientY;
				if (this._drag.item) {
					if (this._drag.ghost) {
						this._drag.pos[0] += dx;
						this._drag.pos[1] += dy;
						this._drag.ghost.style.left = this._drag.pos[0] + "px";
						this._drag.ghost.style.top = this._drag.pos[1] + "px";
					} else {
						var content = this._drag.item.getDOM().content;
						this._drag.ghost = content.cloneNode(true);
						this._drag.ghost.classList.add("ghost");
						this._drag.pos[0] = content.offsetLeft + dx;
						this._drag.pos[1] = content.offsetTop + dy;
						this._drag.ghost.style.left = this._drag.pos[0] + "px";
						this._drag.ghost.style.top = this._drag.pos[1] + "px";
						content.parentNode.appendChild(this._drag.ghost);
						this._port.style.cursor = "move";
					}
				} else {
					this.map.moveBy(dx, dy);
				}
			break;
			
			case "mouseup":
				this._port.style.cursor = "";
				this._port.removeEventListener("mousemove", this);
				this._port.removeEventListener("mouseup", this);
				
				if (this._drag.ghost) {
					var rect = this._drag.ghost.getBoundingClientRect();
					this._drag.ghost.parentNode.removeChild(this._drag.ghost);
					
					var nearest = this.map.getClosestItem(rect.left + rect.width/2, rect.top + rect.height/2);
					this._finishDragDrop(this._drag.item, nearest);
				}

				this._drag.item = null;
				this._drag.ghost = null;
			break;
		} /* switch */
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
		this.keyboard = new MM.Keyboard();

		this._port.addEventListener("mousedown", this);
		this._port.addEventListener("click", this);
		this._port.addEventListener("dblclick", this);
		window.addEventListener("resize", this);
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
	},
	
	_finishDragDrop: function(item, nearest) {
		var target = nearest.item;
		var tmp = target;
		while (!tmp.isRoot()) {
			if (tmp == item) { return; } /* drop on a child or self */
			tmp = tmp.getParent();
		}
		
		var w1 = item.getDOM().content.offsetWidth;
		var w2 = target.getDOM().content.offsetWidth;
		var w = Math.max(w1, w2);
		var h1 = item.getDOM().content.offsetHeight;
		var h2 = target.getDOM().content.offsetHeight;
		var h = Math.max(h1, h2);
		if (target.isRoot()) { /* append here */
			var action = new MM.Action.MoveItem(item, target);
		} else if (Math.abs(nearest.dx) < w && Math.abs(nearest.dy) < h) { /* append here */
			var action = new MM.Action.MoveItem(item, target);
		} else {
			var dir = target.getParent().getLayout().getChildDirection(target);
			var diff = -1 * (dir == "top" || dir == "bottom" ? nearest.dx : nearest.dy);
			
			var index = target.getParent().getChildren().indexOf(target);
			var targetIndex = index + (diff > 0 ? 1 : 0);
			var action = new MM.Action.MoveItem(item, target.getParent(), targetIndex, target.getSide());
		}
		this.action(action);
		
	}
}
