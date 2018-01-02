MM.Item = function() {
	this._parent = null;
	this._children = [];
	this._collapsed = false;

	this._layout = null;
	this._shape = null;
	this._autoShape = true;
	this._color = null;
	this._value = null;
	this._status = null;
	this._side = null; /* side preference */
	this._icon = null;
	this._id = MM.generateId();
	this._oldText = "";

	this._computed = {
		value: 0,
		status: null
	}

	this._dom = {
		node: document.createElement("li"),
		content: document.createElement("div"),
		status: document.createElement("span"),
		icon: document.createElement("span"),
		value: document.createElement("span"),
		text: document.createElement("div"),
		children: document.createElement("ul"),
		toggle: document.createElement("div"),
		canvas: document.createElement("canvas")
	}
	this._dom.node.classList.add("item");
	this._dom.content.classList.add("content");
	this._dom.status.classList.add("status");
	this._dom.icon.classList.add("icon");
	this._dom.value.classList.add("value");
	this._dom.text.classList.add("text");
	this._dom.toggle.classList.add("toggle");
	this._dom.children.classList.add("children");

	this._dom.content.appendChild(this._dom.text); /* status+value are appended in layout */
	this._dom.node.appendChild(this._dom.canvas);
	this._dom.node.appendChild(this._dom.content);
	/* toggle+children are appended when children exist */

	this._dom.toggle.addEventListener("click", this);
}

MM.Item.COLOR = "#999";

    /* RE explanation:
     *          _________________________________________________________________________ One of the three possible variants
     *           ____________________ scheme://x
     *                                ___________________________ aa.bb.cc
     *                                                            _______________________ aa.bb/
     *                                                                                    ______ path, search
     *                                                                                          __________________________ end with a non-forbidden char
     *                                                                                                                    ______ end of word or end of string
     */                                                                                                                           
MM.Item.RE = /\b(([a-z][\w-]+:\/\/\w)|(([\w-]+\.){2,}[a-z][\w-]+)|([\w-]+\.[a-z][\w-]+\/))[^\s]*([^\s,.;:?!<>\(\)\[\]'"])?($|\b)/i;

MM.Item.fromJSON = function(data) {
	return new this().fromJSON(data);
}

MM.Item.prototype.toJSON = function() {
	var data = {
		id: this._id,
		text: this.getText()
	}
	
	if (this._side) { data.side = this._side; }
	if (this._color) { data.color = this._color; }
	if (this._icon) { data.icon = this._icon; }
	if (this._value) { data.value = this._value; }
	if (this._status) { data.status = this._status; }
	if (this._layout) { data.layout = this._layout.id; }
	if (!this._autoShape) { data.shape = this._shape.id; }
	if (this._collapsed) { data.collapsed = 1; }
	if (this._children.length) {
		data.children = this._children.map(function(child) { return child.toJSON(); });
	}

	return data;
}

/**
 * Only when creating a new item. To merge existing items, use .mergeWith().
 */
MM.Item.prototype.fromJSON = function(data) {
	this.setText(data.text);
	if (data.id) { this._id = data.id; }
	if (data.side) { this._side = data.side; }
	if (data.color) { this._color = data.color; }
	if (data.icon) { this._icon = data.icon; }
	if (data.value) { this._value = data.value; }
	if (data.status) {
		this._status = data.status;
		if (this._status == "maybe") { this._status = "computed"; }
	}
	if (data.collapsed) { this.collapse(); }
	if (data.layout) { this._layout = MM.Layout.getById(data.layout); }
	if (data.shape) { this.setShape(MM.Shape.getById(data.shape)); }

	(data.children || []).forEach(function(child) {
		this.insertChild(MM.Item.fromJSON(child));
	}, this);

	return this;
}

MM.Item.prototype.mergeWith = function(data) {
	var dirty = 0;

	if (this.getText() != data.text && !this._dom.text.contentEditable) { this.setText(data.text); }

	if (this._side != data.side) { 
		this._side = data.side;
		dirty = 1;
	}

	if (this._color != data.color) { 
		this._color = data.color;
		dirty = 2;
	}

	if (this._icon != data.icon) {
		this._icon = data.icon;
		dirty = 1;
	}

	if (this._value != data.value) { 
		this._value = data.value;
		dirty = 1;
	}

	if (this._status != data.status) { 
		this._status = data.status;
		dirty = 1;
	}

	if (this._collapsed != !!data.collapsed) { this[this._collapsed ? "expand" : "collapse"](); }

	if (this.getOwnLayout() != data.layout) {
		this._layout = MM.Layout.getById(data.layout);
		dirty = 2;
	}

	var s = (this._autoShape ? null : this._shape.id);
	if (s != data.shape) { this.setShape(MM.Shape.getById(data.shape)); }

	(data.children || []).forEach(function(child, index) {
		if (index >= this._children.length) { /* new child */
			this.insertChild(MM.Item.fromJSON(child));
		} else { /* existing child */
			var myChild = this._children[index];
			if (myChild.getId() == child.id) { /* recursive merge */
				myChild.mergeWith(child);
			} else { /* changed; replace */
				this.removeChild(this._children[index]);
				this.insertChild(MM.Item.fromJSON(child), index);
			}
		}
	}, this);

	/* remove dead children */
	var newLength = (data.children || []).length;
	while (this._children.length > newLength) { this.removeChild(this._children[this._children.length-1]); }

	if (dirty == 1) { this.update(); }
	if (dirty == 2) { this.updateSubtree(); }
}

MM.Item.prototype.clone = function() {
	var data = this.toJSON();

	var removeId = function(obj) {
		delete obj.id;
		obj.children && obj.children.forEach(removeId);
	}
	removeId(data);

	return this.constructor.fromJSON(data);
}

MM.Item.prototype.select = function() {
	this._dom.node.classList.add("current");
	this.getMap().ensureItemVisibility(this);
	MM.Clipboard.focus(); /* going to mode 2c */
	MM.publish("item-select", this);
}

MM.Item.prototype.deselect = function() {
	/* we were in 2b; finish that via 3b */
	if (MM.App.editing) { MM.Command.Finish.execute(); }
	this._dom.node.classList.remove("current");
}

MM.Item.prototype.update = function(doNotRecurse) {
	var map = this.getMap();
	if (!map || !map.isVisible()) { return this; }

	MM.publish("item-change", this);

	if (this._autoShape) { /* check for changed auto-shape */
		var autoShape = this._getAutoShape();
		if (autoShape != this._shape) {
			if (this._shape) { this._shape.unset(this); }
			this._shape = autoShape;
			this._shape.set(this);
		}
	}
	
	this._updateStatus();
	this._updateIcon();
	this._updateValue();

	this._dom.node.classList[this._collapsed ? "add" : "remove"]("collapsed");

	this.getLayout().update(this);
	this.getShape().update(this);
	if (!this.isRoot() && !doNotRecurse) { this._parent.update(); }

	return this;
}

MM.Item.prototype.updateSubtree = function(isSubChild) {
	this._children.forEach(function(child) {
		child.updateSubtree(true);
	});
	return this.update(isSubChild);
}

MM.Item.prototype.setText = function(text) {
	this._dom.text.innerHTML = text;
	this._findLinks(this._dom.text);
	return this.update();
}

MM.Item.prototype.getId = function() {
	return this._id;
}

MM.Item.prototype.getText = function() {
	return this._dom.text.innerHTML;
}

MM.Item.prototype.collapse = function() {
	if (this._collapsed) { return; }
	this._collapsed = true;
	return this.update();
}

MM.Item.prototype.expand = function() {
	if (!this._collapsed) { return; }
	this._collapsed = false;
	this.update();
	return this.updateSubtree();
}

MM.Item.prototype.isCollapsed = function() {
	return this._collapsed;
}

MM.Item.prototype.setValue = function(value) {
	this._value = value;
	return this.update();
}

MM.Item.prototype.getValue = function() {
	return this._value;
}

MM.Item.prototype.getComputedValue = function() {
	return this._computed.value;
}

MM.Item.prototype.setStatus = function(status) {
	this._status = status;
	return this.update();
}

MM.Item.prototype.getStatus = function() {
	return this._status;
}

MM.Item.prototype.setIcon = function(icon) {
	this._icon = icon;
	return this.update();
}

MM.Item.prototype.getIcon = function() {
	return this._icon;
}

MM.Item.prototype.getComputedStatus = function() {
	return this._computed.status;
}

MM.Item.prototype.setSide = function(side) {
	this._side = side;
	return this;
}

MM.Item.prototype.getSide = function() {
	return this._side;
}

MM.Item.prototype.getChildren = function() {
	return this._children;
}

MM.Item.prototype.setColor = function(color) {
	this._color = color;
	return this.updateSubtree();
}

MM.Item.prototype.getColor = function() {
	return this._color || (this.isRoot() ? MM.Item.COLOR : this._parent.getColor());
}

MM.Item.prototype.getOwnColor = function() {
	return this._color;
}

MM.Item.prototype.getLayout = function() {
	return this._layout || this._parent.getLayout();
}

MM.Item.prototype.getOwnLayout = function() {
	return this._layout;
}

MM.Item.prototype.setLayout = function(layout) {
	this._layout = layout;
	return this.updateSubtree();	
}

MM.Item.prototype.getShape = function() {
	return this._shape;
}

MM.Item.prototype.getOwnShape = function() {
	return (this._autoShape ? null : this._shape);
}

MM.Item.prototype.setShape = function(shape) {
	if (this._shape) { this._shape.unset(this); }

	if (shape) {
		this._autoShape = false;
		this._shape = shape;
	} else {
		this._autoShape = true;
		this._shape = this._getAutoShape();
	}

	this._shape.set(this);
	return this.update();
}

MM.Item.prototype.getDOM = function() {
	return this._dom;
}

MM.Item.prototype.getMap = function() {
	var item = this._parent;
	while (item) {
		if (item instanceof MM.Map) { return item; }
		item = item.getParent();
	}
	return null;
}

MM.Item.prototype.getParent = function() {
	return this._parent;
}

MM.Item.prototype.isRoot = function() {
	return (this._parent instanceof MM.Map);
}

MM.Item.prototype.setParent = function(parent) {
	this._parent = parent;
	return this.updateSubtree();
}

MM.Item.prototype.insertChild = function(child, index) {
	/* Create or remove child as necessary. This must be done before computing the index (inserting own child) */
	var newChild = false;
	if (!child) { 
		child = new MM.Item();
		newChild = true;
	} else if (child.getParent() && child.getParent().removeChild) { /* only when the child has non-map parent */
		child.getParent().removeChild(child);
	}

	if (!this._children.length) {
		this._dom.node.appendChild(this._dom.toggle);
		this._dom.node.appendChild(this._dom.children);
	}

	if (arguments.length < 2) { index = this._children.length; }
	
	var next = null;
	if (index < this._children.length) { next = this._children[index].getDOM().node; }
	this._dom.children.insertBefore(child.getDOM().node, next);
	this._children.splice(index, 0, child);
	
	return child.setParent(this);
}

MM.Item.prototype.removeChild = function(child) {
	var index = this._children.indexOf(child);
	this._children.splice(index, 1);
	var node = child.getDOM().node;
	node.parentNode.removeChild(node);
	
	child.setParent(null);
	
	if (!this._children.length) {
		this._dom.toggle.parentNode.removeChild(this._dom.toggle);
		this._dom.children.parentNode.removeChild(this._dom.children);
	}
	
	return this.update();
}

MM.Item.prototype.startEditing = function() {
	this._oldText = this.getText();
	this._dom.text.contentEditable = true;
	this._dom.text.focus(); /* switch to 2b */
	document.execCommand("styleWithCSS", null, false);

	this._dom.text.addEventListener("input", this);
	this._dom.text.addEventListener("keydown", this);
	this._dom.text.addEventListener("blur", this);
	return this;
}

MM.Item.prototype.stopEditing = function() {
	this._dom.text.removeEventListener("input", this);
	this._dom.text.removeEventListener("keydown", this);
	this._dom.text.removeEventListener("blur", this);

	this._dom.text.blur();
	this._dom.text.contentEditable = false;
	var result = this._dom.text.innerHTML;
	this._dom.text.innerHTML = this._oldText;
	this._oldText = "";

	this.update(); /* text changed */

	MM.Clipboard.focus();

	return result;
}

MM.Item.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "input":
			this.update();
			this.getMap().ensureItemVisibility(this);
		break;

		case "keydown":
			if (e.keyCode == 9) { e.preventDefault(); } /* TAB has a special meaning in this app, do not use it to change focus */
		break;

		case "blur": /* 3d */
			MM.Command.Finish.execute();
		break;

		case "click":
			if (this._collapsed) { this.expand(); } else { this.collapse(); }
			MM.App.select(this);
		break;
	}
}

MM.Item.prototype._getAutoShape = function() {
	var depth = 0;
	var node = this;
	while (!node.isRoot()) {
		depth++;
		node = node.getParent();
	}
	switch (depth) {
		case 0: return MM.Shape.Ellipse;
		case 1: return MM.Shape.Box;
		default: return MM.Shape.Underline;
	}
}

MM.Item.prototype._updateStatus = function() {
	this._dom.status.className = "status";
	this._dom.status.style.display = "";

	var status = this._status;
	if (this._status == "computed") {
		var childrenStatus = this._children.every(function(child) {
			return (child.getComputedStatus() !== false);
		});
		status = (childrenStatus ? "yes" : "no");
	}

	switch (status) {
		case "yes":
			this._dom.status.classList.add("yes");
			this._computed.status = true;
		break;

		case "no":
			this._dom.status.classList.add("no");
			this._computed.status = false;
		break;

		default:
			this._computed.status = null;
			this._dom.status.style.display = "none";
		break;
	}
}
MM.Item.prototype._updateIcon = function() {
    this._dom.icon.className = "icon";
    this._dom.icon.style.display = "";

    var icon = this._icon;
    if (icon)
	{
        this._dom.icon.classList.add('fa');
        this._dom.icon.classList.add(icon);
        this._computed.icon = true;
	} else {
        this._computed.icon = null;
        this._dom.icon.style.display = "none";
	}
}

MM.Item.prototype._updateValue = function() {
	this._dom.value.style.display = "";

	if (typeof(this._value) == "number") {
		this._computed.value = this._value;
		this._dom.value.innerHTML = this._value;
		return;
	}
	
	var childValues = this._children.map(function(child) {
		return child.getComputedValue();
	});
	
	var result = 0;
	switch (this._value) {
		case "sum":
			result = childValues.reduce(function(prev, cur) {
				return prev+cur;
			}, 0);
		break;
		
		case "avg":
			var sum = childValues.reduce(function(prev, cur) {
				return prev+cur;
			}, 0);
			result = (childValues.length ? sum/childValues.length : 0);
		break;
		
		case "max":
			result = Math.max.apply(Math, childValues);
		break;
		
		case "min":
			result = Math.min.apply(Math, childValues);
		break;
		
		default:
			this._computed.value = 0;
			this._dom.value.innerHTML = "";
			this._dom.value.style.display = "none";
			return;
		break;
	}
	
	this._computed.value = result;
	this._dom.value.innerHTML = (Math.round(result) == result ? result : result.toFixed(3));
}

MM.Item.prototype._findLinks = function(node) {

	var children = [].slice.call(node.childNodes);
	for (var i=0;i<children.length;i++) {
		var child = children[i];
		switch (child.nodeType) {
			case 1: /* element */
				if (child.nodeName.toLowerCase() == "a") { continue; }
				this._findLinks(child);
			break;
			
			case 3: /* text */
				var result = child.nodeValue.match(this.constructor.RE);
				if (result) {
					var before = child.nodeValue.substring(0, result.index);
					var after = child.nodeValue.substring(result.index + result[0].length);
					var link = document.createElement("a");
					link.innerHTML = link.href = result[0];
					
					if (before) {
						node.insertBefore(document.createTextNode(before), child);
					}

					node.insertBefore(link, child);
					
					if (after) {
						child.nodeValue = after;
						i--; /* re-try with the aftertext */
					} else {
						node.removeChild(child);
					}
				}
			break;
		}
	}
}
