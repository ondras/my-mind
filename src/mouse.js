MM.Mouse = {
	TOUCH_DELAY: 500,
	_port: null,
	_cursor: [0, 0],
	_pos: [0, 0], /* ghost pos */
	_mode: "",
	_item: null,
	_ghost: null,
	_oldDragState: null,
	_touchTimeout: null
}

MM.Mouse.init = function(port) {
	this._port = port;
	this._port.addEventListener("touchstart", this);
	this._port.addEventListener("mousedown", this);
	this._port.addEventListener("click", this);
	this._port.addEventListener("dblclick", this);
	this._port.addEventListener("wheel", this);
	this._port.addEventListener("mousewheel", this);
	this._port.addEventListener("contextmenu", this);
}

MM.Mouse.handleEvent = function(e) {
	switch (e.type) {
		case "click":
			var item = MM.App.map.getItemFor(e.target);
			if (MM.App.editing && item == MM.App.current) { return; } /* ignore on edited node */
			if (item) { MM.App.select(item); }
		break;

		case "dblclick":
			var item = MM.App.map.getItemFor(e.target);
			if (item) { MM.Command.Edit.execute(); }
		break;

		case "contextmenu":
			this._endDrag();
			e.preventDefault();

			var item = MM.App.map.getItemFor(e.target);
			item && MM.App.select(item);

			MM.Menu.open(e.clientX, e.clientY);
		break;

		case "touchstart":
			if (e.touches.length > 1) { return; }
			e.clientX = e.touches[0].clientX;
			e.clientY = e.touches[0].clientY;
		case "mousedown":
			var item = MM.App.map.getItemFor(e.target);
			if (MM.App.editing) {
				if (item == MM.App.current) { return; } /* ignore dnd on edited node */
				MM.Command.Finish.execute(); /* clicked elsewhere => finalize edit */
			}

			if (e.type == "mousedown") { e.preventDefault(); } /* to prevent blurring the clipboard node */

			if (e.type == "touchstart") { /* context menu here, after we have the item */
				this._touchTimeout = setTimeout(function() {
					item && MM.App.select(item);
					MM.Menu.open(e.clientX, e.clientY);
				}, this.TOUCH_DELAY);
			}

			this._startDrag(e, item);
		break;

		case "touchmove":
			if (e.touches.length > 1) { return; }
			e.clientX = e.touches[0].clientX;
			e.clientY = e.touches[0].clientY;
			clearTimeout(this._touchTimeout);
		case "mousemove":
			this._processDrag(e);
		break;

		case "touchend":
			clearTimeout(this._touchTimeout);
		case "mouseup":
			this._endDrag();
		break;

		case "wheel":
		case "mousewheel":
			var dir = 0;
			if (e.wheelDelta) {
				if (e.wheelDelta < 0) {
					dir = -1;
				} else if (e.wheelDelta > 0) {
					dir = 1;
				}
			}
			if (e.deltaY) {
				if (e.deltaY > 0) {
					dir = -1;
				} else if (e.deltaY < 0) {
					dir = 1;
				}
			}
			if (dir) {
				MM.App.adjustFontSize(dir);
			}
		break;
	}
}

MM.Mouse._startDrag = function(e, item) {

	if (e.type == "mousedown") {
		e.preventDefault(); /* no selections allowed. only for mouse; preventing touchstart would prevent Safari from emulating clicks */
		this._port.addEventListener("mousemove", this);
		this._port.addEventListener("mouseup", this);
	} else {
		this._port.addEventListener("touchmove", this);
		this._port.addEventListener("touchend", this);
	}

	this._cursor[0] = e.clientX;
	this._cursor[1] = e.clientY;

	if (item && !item.isRoot()) {
		this._mode = "drag";
		this._item = item;
	} else {
		this._mode = "pan";
		this._port.style.cursor = "move";
	}
}

MM.Mouse._processDrag = function(e) {
	e.preventDefault();
	var dx = e.clientX - this._cursor[0];
	var dy = e.clientY - this._cursor[1];
	this._cursor[0] = e.clientX;
	this._cursor[1] = e.clientY;

	switch (this._mode) {
		case "drag":
			if (!this._ghost) {
				this._port.style.cursor = "move";
				this._buildGhost(dx, dy);
			}
			this._moveGhost(dx, dy);
			var state = this._computeDragState();
			this._visualizeDragState(state);
		break;

		case "pan":
			MM.App.map.moveBy(dx, dy);
		break;
	}
}

MM.Mouse._endDrag = function() {
	this._port.style.cursor = "";
	this._port.removeEventListener("mousemove", this);
	this._port.removeEventListener("mouseup", this);

	if (this._mode == "pan") { return; } /* no cleanup after panning */

	if (this._ghost) {
		var state = this._computeDragState();
		this._finishDragDrop(state);

		this._ghost.parentNode.removeChild(this._ghost);
		this._ghost = null;
	}

	this._item = null;
}

MM.Mouse._buildGhost = function() {
	var content = this._item.getDOM().content;
	this._ghost = content.cloneNode(true);
	this._ghost.classList.add("ghost");
	this._pos[0] = content.offsetLeft;
	this._pos[1] = content.offsetTop;
	content.parentNode.appendChild(this._ghost);
}

MM.Mouse._moveGhost = function(dx, dy) {
	this._pos[0] += dx;
	this._pos[1] += dy;
	this._ghost.style.left = this._pos[0] + "px";
	this._ghost.style.top = this._pos[1] + "px";

	var state = this._computeDragState();
}

MM.Mouse._finishDragDrop = function(state) {
	this._visualizeDragState(null);

	var target = state.item;
	switch (state.result) {
		case "append":
			var action = new MM.Action.MoveItem(this._item, target);
		break;

		case "sibling":
			var index = target.getParent().getChildren().indexOf(target);
			var targetIndex = index + (state.direction == "right" || state.direction == "bottom" ? 1 : 0);
			var action = new MM.Action.MoveItem(this._item, target.getParent(), targetIndex, target.getSide());
		break;

		default:
			return;
		break;
	}

	MM.App.action(action);
}

/**
 * Compute a state object for a drag: current result (""/"append"/"sibling"), parent/sibling, direction
 */
MM.Mouse._computeDragState = function() {
	var rect = this._ghost.getBoundingClientRect();
	var closest = MM.App.map.getClosestItem(rect.left + rect.width/2, rect.top + rect.height/2);
	var target = closest.item;

	var state = {
		result: "",
		item: target,
		direction: ""
	}

	var tmp = target;
	while (!tmp.isRoot()) {
		if (tmp == this._item) { return state; } /* drop on a child or self */
		tmp = tmp.getParent();
	}

	var w1 = this._item.getDOM().content.offsetWidth;
	var w2 = target.getDOM().content.offsetWidth;
	var w = Math.max(w1, w2);
	var h1 = this._item.getDOM().content.offsetHeight;
	var h2 = target.getDOM().content.offsetHeight;
	var h = Math.max(h1, h2);

	if (target.isRoot()) { /* append here */
		state.result = "append";
	} else if (Math.abs(closest.dx) < w && Math.abs(closest.dy) < h) { /* append here */
		state.result = "append";
	} else {
		state.result = "sibling";
		var childDirection = target.getParent().getLayout().getChildDirection(target);
		var diff = -1 * (childDirection == "top" || childDirection == "bottom" ? closest.dx : closest.dy);

		if (childDirection == "left" || childDirection == "right") {
			state.direction = (closest.dy < 0 ? "bottom" : "top");
		} else {
			state.direction = (closest.dx < 0 ? "right" : "left");
		}
	}

	return state;
}

MM.Mouse._visualizeDragState = function(state) {
	if (this._oldState && state && this._oldState.item == state.item && this._oldState.result == state.result) { return; } /* nothing changed */

	if (this._oldDragState) { /* remove old vis */
		var item = this._oldDragState.item;
		var node = item.getDOM().content;
		node.style.boxShadow = "";
	}

	this._oldDragState = state;

	if (state) { /* show new vis */
		var item = state.item;
		var node = item.getDOM().content;

		var x = 0;
		var y = 0;
		var offset = 5;
		if (state.result == "sibling") {
			if (state.direction == "left") { x = -1; }
			if (state.direction == "right") { x = +1; }
			if (state.direction == "top") { y = -1; }
			if (state.direction == "bottom") { y = +1; }
		}
		var spread = (x || y ? -2 : 2);
		node.style.boxShadow = (x*offset) + "px " + (y*offset) + "px 2px " + spread + "px #000";
	}
}
