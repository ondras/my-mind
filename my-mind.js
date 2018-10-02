/* My Mind web app: all source files combined. */
if (!Function.prototype.bind) {
	Function.prototype.bind = function(thisObj) {
		var fn = this;
		var args = Array.prototype.slice.call(arguments, 1);
		return function() {
			return fn.apply(thisObj, args.concat(Array.prototype.slice.call(arguments)));
		}
	}
};

var MM = {
	_subscribers: {},
	
	publish: function(message, publisher, data) {
		var subscribers = this._subscribers[message] || [];
		subscribers.forEach(function(subscriber) {
			subscriber.handleMessage(message, publisher, data);
		});
	},
	
	subscribe: function(message, subscriber) {
		if (!(message in this._subscribers)) {
			this._subscribers[message] = [];
		}
		var index = this._subscribers[message].indexOf(subscriber);
		if (index == -1) { this._subscribers[message].push(subscriber); }
	},
	
	unsubscribe: function(message, subscriber) {
		var index = this._subscribers[message].indexOf(subscriber);
		if (index > -1) { this._subscribers[message].splice(index, 1); }
	},
	
	generateId: function() {
		var str = "";
		for (var i=0;i<8;i++) {
			var code = Math.floor(Math.random()*26);
			str += String.fromCharCode("a".charCodeAt(0) + code);
		}
		return str;
	}
};
/*
	Any copyright is dedicated to the Public Domain.
	http://creativecommons.org/publicdomain/zero/1.0/
*/

/**
 * @class A promise - value to be resolved in the future.
 * Implements the "Promises/A+" specification.
 */
var Promise = function(executor) {
	this._state = 0; /* 0 = pending, 1 = fulfilled, 2 = rejected */
	this._value = null; /* fulfillment / rejection value */

	this._cb = {
		fulfilled: [],
		rejected: []
	}

	this._thenPromises = []; /* promises returned by then() */

	executor && executor(this.fulfill.bind(this), this.reject.bind(this));
}

Promise.resolve = function(value) {
	return new Promise().fulfill(value);
}

Promise.reject = function(value) {
	return new Promise().reject(value);
}

/**
 * @param {function} onFulfilled To be called once this promise gets fulfilled
 * @param {function} onRejected To be called once this promise gets rejected
 * @returns {Promise}
 */
Promise.prototype.then = function(onFulfilled, onRejected) {
	this._cb.fulfilled.push(onFulfilled);
	this._cb.rejected.push(onRejected);

	var thenPromise = new Promise();

	this._thenPromises.push(thenPromise);

	if (this._state > 0) {
		setTimeout(this._processQueue.bind(this), 0);
	}

	/* 3.2.6. then must return a promise. */
	return thenPromise; 
}

/**
 * Fulfill this promise with a given value
 * @param {any} value
 */
Promise.prototype.fulfill = function(value) {
	if (this._state != 0) { return this; }

	this._state = 1;
	this._value = value;

	this._processQueue();

	return this;
}

/**
 * Reject this promise with a given value
 * @param {any} value
 */
Promise.prototype.reject = function(value) {
	if (this._state != 0) { return this; }

	this._state = 2;
	this._value = value;

	this._processQueue();

	return this;
}

/**
 * Pass this promise's resolved value to another promise
 * @param {Promise} promise
 */
Promise.prototype.chain = function(promise) {
	return this.then(promise.fulfill.bind(promise), promise.reject.bind(promise));
}

/**
 * @param {function} onRejected To be called once this promise gets rejected
 * @returns {Promise}
 */
Promise.prototype["catch"] = function(onRejected) {
	return this.then(null, onRejected);
}

Promise.prototype._processQueue = function() {
	while (this._thenPromises.length) {
		var onFulfilled = this._cb.fulfilled.shift();
		var onRejected = this._cb.rejected.shift();
		this._executeCallback(this._state == 1 ? onFulfilled : onRejected);
	}
}

Promise.prototype._executeCallback = function(cb) {
	var thenPromise = this._thenPromises.shift();

	if (typeof(cb) != "function") {
		if (this._state == 1) {
			/* 3.2.6.4. If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value. */
			thenPromise.fulfill(this._value);
		} else {
			/* 3.2.6.5. If onRejected is not a function and promise1 is rejected, promise2 must be rejected with the same reason. */
			thenPromise.reject(this._value);
		}
		return;
	}

	try {
		var returned = cb(this._value);

		if (returned && typeof(returned.then) == "function") {
			/* 3.2.6.3. If either onFulfilled or onRejected returns a promise (call it returnedPromise), promise2 must assume the state of returnedPromise */
			var fulfillThenPromise = function(value) { thenPromise.fulfill(value); }
			var rejectThenPromise = function(value) { thenPromise.reject(value); }
			returned.then(fulfillThenPromise, rejectThenPromise);
		} else {
			/* 3.2.6.1. If either onFulfilled or onRejected returns a value that is not a promise, promise2 must be fulfilled with that value. */ 
			thenPromise.fulfill(returned);
		}

	} catch (e) {

		/* 3.2.6.2. If either onFulfilled or onRejected throws an exception, promise2 must be rejected with the thrown exception as the reason. */
		thenPromise.reject(e); 

	}
}    
/**
 * Wait for all these promises to complete. One failed => this fails too.
 */
Promise.all = Promise.when = function(all) {
	var promise = new this();
	var counter = 0;
	var results = [];

	for (var i=0;i<all.length;i++) {
		counter++;
		all[i].then(function(index, result) {
			results[index] = result;
			counter--;
			if (!counter) { promise.fulfill(results); }
		}.bind(null, i), function(reason) {
			counter = 1/0;
			promise.reject(reason);
		});
	}

	return promise;
}

/**
 * Promise-based version of setTimeout
 */
Promise.setTimeout = function(ms) {
	var promise = new this();
	setTimeout(function() { promise.fulfill(); }, ms);
	return promise;
}

/**
 * Promise-based version of addEventListener
 */
Promise.event = function(element, event, capture) {
	var promise = new this();
	var cb = function(e) {
		element.removeEventListener(event, cb, capture);
		promise.fulfill(e);
	}
	element.addEventListener(event, cb, capture);
	return promise;
}

/**
 * Promise-based wait for CSS transition end
 */
Promise.transition = function(element) {
	if ("transition" in element.style) {
		return this.event(element, "transitionend", false);
	} else if ("webkitTransition" in element.style) {
		return this.event(element, "webkitTransitionEnd", false);
	} else {
		return new this().fulfill();
	}
}

/**
 * Promise-based version of XMLHttpRequest::send
 */
Promise.send = function(xhr, data) {
	var promise = new this();
	xhr.addEventListener("readystatechange", function(e) {
		if (e.target.readyState != 4) { return; }
		if (e.target.status.toString().charAt(0) == "2") {
			promise.fulfill(e.target);
		} else {
			promise.reject(e.target);
		}
	});
	xhr.send(data);
	return promise;
}

Promise.worker = function(url, message) {
	var promise = new this();
	var worker = new Worker(url);
	Promise.event(worker, "message").then(function(e) {
		promise.fulfill(e.data);
	});
	Promise.event(worker, "error").then(function(e) {
		promise.reject(e.message);
	});
	worker.postMessage(message);
	return promise;
}
/**
 * Prototype for all things categorizable: shapes, layouts, commands, formats, backends...
 */
MM.Repo = {
	id: "", /* internal ID */
	label: "", /* human-readable label */
	getAll: function() {
		var all = [];
		for (var p in this) {
			var val = this[p];
			if (this.isPrototypeOf(val)) { all.push(val); }
		}
		return all;
	},
	getByProperty: function(property, value) {
		return this.getAll().filter(function(item) {
			return item[property] == value;
		})[0] || null;
	},
	getById: function(id) {
		return this.getByProperty("id", id);
	},
	buildOption: function() {
		var o = document.createElement("option");
		o.value = this.id;
		o.innerHTML = this.label;
		return o;
	}
}
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
MM.Map = function(options) {
	var o = {
		root: "My Mind Map",
		layout: MM.Layout.Map
	}
	for (var p in options) { o[p] = options[p]; }
	this._root = null;
	this._visible = false;
	this._position = [0, 0];

	this._setRoot(new MM.Item().setText(o.root).setLayout(o.layout));
}

MM.Map.fromJSON = function(data) {
	return new this().fromJSON(data);
}

MM.Map.prototype.toJSON = function() {
	var data = {
		root: this._root.toJSON()
	};
	return data;
}

MM.Map.prototype.fromJSON = function(data) {
	this._setRoot(MM.Item.fromJSON(data.root));
	return this;
}

MM.Map.prototype.mergeWith = function(data) {
	/* store a sequence of nodes to be selected when merge is over */
	var ids = [];
	var current = MM.App.current;
	var node = current;
	while (node != this) {
		ids.push(node.getId());
		node = node.getParent();
	}

	this._root.mergeWith(data.root);

	if (current.getMap()) { /* selected node still in tree, cool */
		/* if one of the parents got collapsed, act as if the node got removed */
		var node = current.getParent();
		var hidden = false;
		while (node != this) {
			if (node.isCollapsed()) { hidden = true; }
			node = node.getParent();
		}
		if (!hidden) { return; } /* nothing bad happened, continue */
	} 

	/* previously selected node is no longer in the tree OR it is folded */

	/* what if the node was being edited? */
	if (MM.App.editing) { current.stopEditing(); } 

	/* get all items by their id */
	var idMap = {};
	var scan = function(item) {
		idMap[item.getId()] = item;
		item.getChildren().forEach(scan);
	}
	scan(this._root);

	/* select the nearest existing parent */
	while (ids.length) {
		var id = ids.shift();
		if (id in idMap) {
			MM.App.select(idMap[id]);
			return;
		}
	}
}

MM.Map.prototype.isVisible = function() {
	return this._visible;
}

MM.Map.prototype.update = function() {
	this._root.updateSubtree();
	return this;
}

MM.Map.prototype.show = function(where) {
	var node = this._root.getDOM().node;
	where.appendChild(node);
	this._visible = true;
	this._root.updateSubtree();
	this.center();
	MM.App.select(this._root);
	return this;
}

MM.Map.prototype.hide = function() {
	var node = this._root.getDOM().node;
	node.parentNode.removeChild(node);
	this._visible = false;
	return this;
}

MM.Map.prototype.center = function() {
	var node = this._root.getDOM().node;
	var port = MM.App.portSize;
	var left = (port[0] - node.offsetWidth)/2;
	var top = (port[1] - node.offsetHeight)/2;
	
	this._moveTo(Math.round(left), Math.round(top));

	return this;
}

MM.Map.prototype.moveBy = function(dx, dy) {
	return this._moveTo(this._position[0]+dx, this._position[1]+dy);
}

MM.Map.prototype.getClosestItem = function(x, y) {
	var all = [];

	var scan = function(item) {
		var rect = item.getDOM().content.getBoundingClientRect();
		var dx = rect.left + rect.width/2 - x;
		var dy = rect.top + rect.height/2 - y;
		all.push({
			item: item,
			dx: dx,
			dy: dy
		});
		if (!item.isCollapsed()) { item.getChildren().forEach(scan); }
	}
	
	scan(this._root);
	
	all.sort(function(a, b) {
		var da = a.dx*a.dx + a.dy*a.dy;
		var db = b.dx*b.dx + b.dy*b.dy;
		return da-db;
	});
	
	return all[0];
}

MM.Map.prototype.getItemFor = function(node) {
	var port = this._root.getDOM().node.parentNode;
	while (node != port && !node.classList.contains("content")) {
		node = node.parentNode;
	}	
	if (node == port) { return null; }

	var scan = function(item, node) {
		if (item.getDOM().content == node) { return item; }
		var children = item.getChildren();
		for (var i=0;i<children.length;i++) {
			var result = scan(children[i], node);
			if (result) { return result; }
		}
		return null;
	}

	return scan(this._root, node);
}

MM.Map.prototype.ensureItemVisibility = function(item) {
	var padding = 10;

	var node = item.getDOM().content;
	var itemRect = node.getBoundingClientRect();
	var root = this._root.getDOM().node;
	var parentRect = root.parentNode.getBoundingClientRect();

	var delta = [0, 0];

	var dx = parentRect.left-itemRect.left+padding;
	if (dx > 0) { delta[0] = dx; }
	var dx = parentRect.right-itemRect.right-padding;
	if (dx < 0) { delta[0] = dx; }

	var dy = parentRect.top-itemRect.top+padding;
	if (dy > 0) { delta[1] = dy; }
	var dy = parentRect.bottom-itemRect.bottom-padding;
	if (dy < 0) { delta[1] = dy; }

	if (delta[0] || delta[1]) {
		this.moveBy(delta[0], delta[1]);
	}
}

MM.Map.prototype.getParent = function() {
	return null;
}

MM.Map.prototype.getRoot = function() {
	return this._root;
}

MM.Map.prototype.getName = function() {
	var name = this._root.getText();
	return MM.Format.br2nl(name).replace(/\n/g, " ").replace(/<.*?>/g, "").trim();
}

MM.Map.prototype.getId = function() {
	return this._root.getId();
}

MM.Map.prototype.pick = function(item, direction) {
	var candidates = [];
	var currentRect = item.getDOM().content.getBoundingClientRect();

	this._getPickCandidates(currentRect, this._root, direction, candidates);
	if (!candidates.length) { return item; }

	candidates.sort(function(a, b) {
		return a.dist - b.dist;
	});

	return candidates[0].item;
}

MM.Map.prototype._getPickCandidates = function(currentRect, item, direction, candidates) {
	if (!item.isCollapsed()) {
		item.getChildren().forEach(function(child) {
			this._getPickCandidates(currentRect, child, direction, candidates);
		}, this);
	}

	var node = item.getDOM().content;
	var rect = node.getBoundingClientRect();

	if (direction == "left" || direction == "right") {
		var x1 = currentRect.left + currentRect.width/2;
		var x2 = rect.left + rect.width/2;
		if (direction == "left" && x2 > x1) { return; }
		if (direction == "right" && x2 < x1) { return; }

		var diff1 = currentRect.top - rect.bottom;
		var diff2 = rect.top - currentRect.bottom;
		var dist = Math.abs(x2-x1);
	} else {
		var y1 = currentRect.top + currentRect.height/2;
		var y2 = rect.top + rect.height/2;
		if (direction == "top" && y2 > y1) { return; }
		if (direction == "bottom" && y2 < y1) { return; }

		var diff1 = currentRect.left - rect.right;
		var diff2 = rect.left - currentRect.right;
		var dist = Math.abs(y2-y1);
	}

	var diff = Math.max(diff1, diff2);
	if (diff > 0) { return; }
	if (!dist || dist < diff) { return; }

	candidates.push({item:item, dist:dist});
}

MM.Map.prototype._moveTo = function(left, top) {
	this._position = [left, top];

	var node = this._root.getDOM().node;
	node.style.left = left + "px";
	node.style.top = top + "px";
}

MM.Map.prototype._setRoot = function(item) {
	this._root = item;
	this._root.setParent(this);
}
MM.Keyboard = {};
MM.Keyboard.init = function() {
	window.addEventListener("keydown", this);
	window.addEventListener("keypress", this);
}

MM.Keyboard.handleEvent = function(e) {
	/* mode 2a: ignore keyboard when the activeElement resides somewhere inside of the UI pane */
	var node = document.activeElement;
	while (node && node != document) {
		if (node.classList.contains("ui")) { return; }
		node = node.parentNode;
	}
	
	var commands = MM.Command.getAll();
	for (var i=0;i<commands.length;i++) {
		var command = commands[i];
		if (!command.isValid()) { continue; }
		var keys = command.keys;
		for (var j=0;j<keys.length;j++) {
			if (this._keyOK(keys[j], e)) {
				command.prevent && e.preventDefault();
				command.execute(e);
				return;
			}
		}
	}
}

MM.Keyboard._keyOK = function(key, e) {
	if ("keyCode" in key && e.type != "keydown") { return false; }
	if ("charCode" in key && e.type != "keypress") { return false; }
	for (var p in key) {
		if (key[p] != e[p]) { return false; }
	}
	return true;
}
MM.Tip = {
	_node: null,

	handleEvent: function() {
		this._hide();
	},

	handleMessage: function() {
		this._hide();
	},

	init: function() {
		this._node = document.querySelector("#tip");
		this._node.addEventListener("click", this);

		MM.subscribe("command-child", this);
		MM.subscribe("command-sibling", this);
	},

	_hide: function() {
		MM.unsubscribe("command-child", this);
		MM.unsubscribe("command-sibling", this);

		this._node.removeEventListener("click", this);
		this._node.classList.add("hidden");
		this._node = null;
	}
}
MM.Action = function() {}
MM.Action.prototype.perform = function() {}
MM.Action.prototype.undo = function() {}

MM.Action.Multi = function(actions) {
	this._actions = actions;
}
MM.Action.Multi.prototype = Object.create(MM.Action.prototype);
MM.Action.Multi.prototype.perform = function() {
	this._actions.forEach(function(action) {
		action.perform();
	});
}
MM.Action.Multi.prototype.undo = function() {
	this._actions.slice().reverse().forEach(function(action) {
		action.undo();
	});
}

MM.Action.InsertNewItem = function(parent, index) {
	this._parent = parent;
	this._index = index;
	this._item = new MM.Item();
}
MM.Action.InsertNewItem.prototype = Object.create(MM.Action.prototype);
MM.Action.InsertNewItem.prototype.perform = function() {
	this._parent.expand(); /* FIXME remember? */
	this._item = this._parent.insertChild(this._item, this._index);
	MM.App.select(this._item);
}
MM.Action.InsertNewItem.prototype.undo = function() {
	this._parent.removeChild(this._item);
	MM.App.select(this._parent);
}

MM.Action.AppendItem = function(parent, item) {
	this._parent = parent;
	this._item = item;
}
MM.Action.AppendItem.prototype = Object.create(MM.Action.prototype);
MM.Action.AppendItem.prototype.perform = function() {
	this._parent.insertChild(this._item);
	MM.App.select(this._item);
}
MM.Action.AppendItem.prototype.undo = function() {
	this._parent.removeChild(this._item);
	MM.App.select(this._parent);
}

MM.Action.RemoveItem = function(item) {
	this._item = item;
	this._parent = item.getParent();
	this._index = this._parent.getChildren().indexOf(this._item);
}
MM.Action.RemoveItem.prototype = Object.create(MM.Action.prototype);
MM.Action.RemoveItem.prototype.perform = function() {
	this._parent.removeChild(this._item);
	MM.App.select(this._parent);
}
MM.Action.RemoveItem.prototype.undo = function() {
	this._parent.insertChild(this._item, this._index);
	MM.App.select(this._item);
}

MM.Action.MoveItem = function(item, newParent, newIndex, newSide) {
	this._item = item;
	this._newParent = newParent;
	this._newIndex = (arguments.length < 3 ? null : newIndex);
	this._newSide = newSide || "";
	this._oldParent = item.getParent();
	this._oldIndex = this._oldParent.getChildren().indexOf(item);
	this._oldSide = item.getSide();
}
MM.Action.MoveItem.prototype = Object.create(MM.Action.prototype);
MM.Action.MoveItem.prototype.perform = function() {
	this._item.setSide(this._newSide);
	if (this._newIndex === null) {
		this._newParent.insertChild(this._item);
	} else {
		this._newParent.insertChild(this._item, this._newIndex);
	}
	MM.App.select(this._item);
}
MM.Action.MoveItem.prototype.undo = function() {
	this._item.setSide(this._oldSide);
	this._oldParent.insertChild(this._item, this._oldIndex);
	MM.App.select(this._newParent);
}

MM.Action.Swap = function(item, diff) {
	this._item = item;
	this._parent = item.getParent();

	var children = this._parent.getChildren();
	var sibling = this._parent.getLayout().pickSibling(this._item, diff);
	
	this._sourceIndex = children.indexOf(this._item);
	this._targetIndex = children.indexOf(sibling);
}
MM.Action.Swap.prototype = Object.create(MM.Action.prototype);
MM.Action.Swap.prototype.perform = function() {
	this._parent.insertChild(this._item, this._targetIndex);
}
MM.Action.Swap.prototype.undo = function() {
	this._parent.insertChild(this._item, this._sourceIndex);
}

MM.Action.SetLayout = function(item, layout) {
	this._item = item;
	this._layout = layout;
	this._oldLayout = item.getOwnLayout();
}
MM.Action.SetLayout.prototype = Object.create(MM.Action.prototype);
MM.Action.SetLayout.prototype.perform = function() {
	this._item.setLayout(this._layout);
}
MM.Action.SetLayout.prototype.undo = function() {
	this._item.setLayout(this._oldLayout);
}

MM.Action.SetShape = function(item, shape) {
	this._item = item;
	this._shape = shape;
	this._oldShape = item.getOwnShape();
}
MM.Action.SetShape.prototype = Object.create(MM.Action.prototype);
MM.Action.SetShape.prototype.perform = function() {
	this._item.setShape(this._shape);
}
MM.Action.SetShape.prototype.undo = function() {
	this._item.setShape(this._oldShape);
}

MM.Action.SetColor = function(item, color) {
	this._item = item;
	this._color = color;
	this._oldColor = item.getOwnColor();
}
MM.Action.SetColor.prototype = Object.create(MM.Action.prototype);
MM.Action.SetColor.prototype.perform = function() {
	this._item.setColor(this._color);
}
MM.Action.SetColor.prototype.undo = function() {
	this._item.setColor(this._oldColor);
}

MM.Action.SetText = function(item, text) {
	this._item = item;
	this._text = text;
	this._oldText = item.getText();
	this._oldValue = item.getValue(); /* adjusting text can also modify value! */
}
MM.Action.SetText.prototype = Object.create(MM.Action.prototype);
MM.Action.SetText.prototype.perform = function() {
	this._item.setText(this._text);
	var numText = Number(this._text);
	if (numText == this._text) { this._item.setValue(numText); }
}
MM.Action.SetText.prototype.undo = function() {
	this._item.setText(this._oldText);
	this._item.setValue(this._oldValue);
}

MM.Action.SetValue = function(item, value) {
	this._item = item;
	this._value = value;
	this._oldValue = item.getValue();
}
MM.Action.SetValue.prototype = Object.create(MM.Action.prototype);
MM.Action.SetValue.prototype.perform = function() {
	this._item.setValue(this._value);
}
MM.Action.SetValue.prototype.undo = function() {
	this._item.setValue(this._oldValue);
}

MM.Action.SetStatus = function(item, status) {
	this._item = item;
	this._status = status;
	this._oldStatus = item.getStatus();
}
MM.Action.SetStatus.prototype = Object.create(MM.Action.prototype);
MM.Action.SetStatus.prototype.perform = function() {
	this._item.setStatus(this._status);
}
MM.Action.SetStatus.prototype.undo = function() {
	this._item.setStatus(this._oldStatus);
}

MM.Action.SetIcon = function(item, icon) {
	this._item = item;
	this._icon = icon;
	this._oldIcon = item.getIcon();
}
MM.Action.SetIcon.prototype = Object.create(MM.Action.prototype);
MM.Action.SetIcon.prototype.perform = function() {
	this._item.setIcon(this._icon);
}
MM.Action.SetIcon.prototype.undo = function() {
	this._item.setIcon(this._oldIcon);
}

MM.Action.SetSide = function(item, side) {
	this._item = item;
	this._side = side;
	this._oldSide = item.getSide();
}
MM.Action.SetSide.prototype = Object.create(MM.Action.prototype);
MM.Action.SetSide.prototype.perform = function() {
	this._item.setSide(this._side);
	this._item.getMap().update();
}
MM.Action.SetStatus.prototype.undo = function() {
	this._item.setSide(this._oldSide);
	this._item.getMap().update();
}
MM.Clipboard = {
	_item: null,
	_mode: "",
	_delay: 50,
	_node: document.createElement("textarea")
};

MM.Clipboard.init = function() {
	this._node.style.position = "absolute";
	this._node.style.width = 0;
	this._node.style.height = 0;
	this._node.style.left = "-100px";
	this._node.style.top = "-100px";
	document.body.appendChild(this._node);
}

MM.Clipboard.focus = function() {
	this._node.focus();
	this._empty();
}

MM.Clipboard.copy = function(sourceItem) {
	this._endCut();
	this._item = sourceItem.clone();
	this._mode = "copy";

	this._expose();
}

MM.Clipboard.paste = function(targetItem) {
	setTimeout(function() {
		var pasted = this._node.value;
		this._empty();
		if (!pasted) { return; } /* nothing */

		if (this._item && pasted == MM.Format.Plaintext.to(this._item.toJSON())) { /* pasted a previously copied/cut item */
			this._pasteItem(this._item, targetItem);
		} else { /* pasted some external data */
			this._pastePlaintext(pasted, targetItem);
		}

	}.bind(this), this._delay);
}

MM.Clipboard._pasteItem = function(sourceItem, targetItem) {
	switch (this._mode) {
		case "cut":
			if (sourceItem == targetItem || sourceItem.getParent() == targetItem) { /* abort by pasting on the same node or the parent */
				this._endCut();
				return;
			}

			var item = targetItem;
			while (!item.isRoot()) {
				if (item == sourceItem) { return; } /* moving to a child => forbidden */
				item = item.getParent();
			}

			var action = new MM.Action.MoveItem(sourceItem, targetItem);
			MM.App.action(action);

			this._endCut();
		break;

		case "copy":
			var action = new MM.Action.AppendItem(targetItem, sourceItem.clone());
			MM.App.action(action);
		break;
	}
}

MM.Clipboard._pastePlaintext = function(plaintext, targetItem) {
	if (this._mode == "cut") { this._endCut(); } /* external paste => abort cutting */

	var json = MM.Format.Plaintext.from(plaintext);
	var map = MM.Map.fromJSON(json);
	var root = map.getRoot();

	if (root.getText()) {
		var action = new MM.Action.AppendItem(targetItem, root);
		MM.App.action(action);
	} else {
		var actions = root.getChildren().map(function(item) {
			return new MM.Action.AppendItem(targetItem, item);
		});
		var action = new MM.Action.Multi(actions);
		MM.App.action(action);
	}
}

MM.Clipboard.cut = function(sourceItem) {
	this._endCut();

	this._item = sourceItem;
	this._item.getDOM().node.classList.add("cut");
	this._mode = "cut";

	this._expose();
}

/**
 * Expose plaintext data to the textarea to be copied to system clipboard. Clear afterwards.
 */
MM.Clipboard._expose = function() {
	var json = this._item.toJSON();
	var plaintext = MM.Format.Plaintext.to(json);
	this._node.value = plaintext;
	this._node.selectionStart = 0;
	this._node.selectionEnd = this._node.value.length;
	setTimeout(this._empty.bind(this), this._delay);
}

MM.Clipboard._empty = function() {
	/* safari needs a non-empty selection in order to actually perfrom a real copy on cmd+c */
	this._node.value = "\n";
	this._node.selectionStart = 0;
	this._node.selectionEnd = this._node.value.length;
}

MM.Clipboard._endCut = function() {
	if (this._mode != "cut") { return; }

	this._item.getDOM().node.classList.remove("cut");
	this._item = null;
	this._mode = "";
}
MM.Menu = {
	_dom: {},
	_port: null,
	
	open: function(x, y) {
		this._dom.node.style.display = "";
		var w = this._dom.node.offsetWidth;
		var h = this._dom.node.offsetHeight;

		var left = x;
		var top = y;

		if (left > this._port.offsetWidth / 2) { left -= w; }
		if (top > this._port.offsetHeight / 2) { top -= h; }

		this._dom.node.style.left = left+"px";
		this._dom.node.style.top = top+"px";
	},
	
	close: function() {
		this._dom.node.style.display = "none";
	},
	
	handleEvent: function(e) {
		if (e.currentTarget != this._dom.node) {
			this.close();
			return;
		}
		
		e.stopPropagation(); /* no dragdrop, no blur of activeElement */
		e.preventDefault(); /* we do not want to focus the button */
		
		var command = e.target.getAttribute("data-command");
		if (!command) { return; }

		command = MM.Command[command];
		if (!command.isValid()) { return; }

		command.execute();
		this.close();
	},
	
	init: function(port) {
		this._port = port;
		this._dom.node = document.querySelector("#menu");
		var buttons = this._dom.node.querySelectorAll("[data-command]");
		[].slice.call(buttons).forEach(function(button) {
			button.innerHTML = MM.Command[button.getAttribute("data-command")].label;
		});
		
		this._port.addEventListener("mousedown", this);
		this._dom.node.addEventListener("mousedown", this);
		
		this.close();
	}
}

MM.Command = Object.create(MM.Repo, {
	keys: {value: []},
	editMode: {value: false},
	prevent: {value: true}, /* prevent default keyboard action? */
	label: {value: ""}
});

MM.Command.isValid = function() {
	return (this.editMode === null || this.editMode == MM.App.editing);
}
MM.Command.execute = function() {}

MM.Command.Undo = Object.create(MM.Command, {
	label: {value: "Undo"},
	keys: {value: [{keyCode: "Z".charCodeAt(0), ctrlKey: true}]}
});
MM.Command.Undo.isValid = function() {
	return MM.Command.isValid.call(this) && !!MM.App.historyIndex;
}
MM.Command.Undo.execute = function() {
	MM.App.history[MM.App.historyIndex-1].undo();
	MM.App.historyIndex--;
}

MM.Command.Redo = Object.create(MM.Command, {
	label: {value: "Redo"},
	keys: {value: [{keyCode: "Y".charCodeAt(0), ctrlKey: true}]},
});
MM.Command.Redo.isValid = function() {
	return (MM.Command.isValid.call(this) && MM.App.historyIndex != MM.App.history.length);
}
MM.Command.Redo.execute = function() {
	MM.App.history[MM.App.historyIndex].perform();
	MM.App.historyIndex++;
}

MM.Command.InsertSibling = Object.create(MM.Command, {
	label: {value: "Insert a sibling"},
	keys: {value: [{keyCode: 13}]}
});
MM.Command.InsertSibling.execute = function() {
	var item = MM.App.current;
	if (item.isRoot()) {
		var action = new MM.Action.InsertNewItem(item, item.getChildren().length);
	} else {
		var parent = item.getParent();
		var index = parent.getChildren().indexOf(item);
		var action = new MM.Action.InsertNewItem(parent, index+1);
	}
	MM.App.action(action);

	MM.Command.Edit.execute();

	MM.publish("command-sibling");
}

MM.Command.InsertChild = Object.create(MM.Command, {
	label: {value: "Insert a child"},
	keys: {value: [
		{keyCode: 9, ctrlKey:false},
		{keyCode: 45}
	]}
});
MM.Command.InsertChild.execute = function() {
	var item = MM.App.current;
	var action = new MM.Action.InsertNewItem(item, item.getChildren().length);
	MM.App.action(action);	

	MM.Command.Edit.execute();

	MM.publish("command-child");
}

MM.Command.Delete = Object.create(MM.Command, {
	label: {value: "Delete an item"},
	keys: {value: [{keyCode: 46}]}
});
MM.Command.Delete.isValid = function() {
	return MM.Command.isValid.call(this) && !MM.App.current.isRoot();
}
MM.Command.Delete.execute = function() {
	var action = new MM.Action.RemoveItem(MM.App.current);
	MM.App.action(action);	
}

MM.Command.Swap = Object.create(MM.Command, {
	label: {value: "Swap sibling"},
	keys: {value: [
		{keyCode: 38, ctrlKey:true},
		{keyCode: 40, ctrlKey:true},
	]}
});
MM.Command.Swap.execute = function(e) {
	var current = MM.App.current;
	if (current.isRoot() || current.getParent().getChildren().length < 2) { return; }

	var diff = (e.keyCode == 38 ? -1 : 1);
	var action = new MM.Action.Swap(MM.App.current, diff);
	MM.App.action(action);	
}

MM.Command.Side = Object.create(MM.Command, {
	label: {value: "Change side"},
	keys: {value: [
		{keyCode: 37, ctrlKey:true},
		{keyCode: 39, ctrlKey:true},
	]}
});
MM.Command.Side.execute = function(e) {
	var current = MM.App.current;
	if (current.isRoot() || !current.getParent().isRoot()) { return; }

	var side = (e.keyCode == 37 ? "left" : "right");
	var action = new MM.Action.SetSide(MM.App.current, side);
	MM.App.action(action);
}

MM.Command.Save = Object.create(MM.Command, {
	label: {value: "Save map"},
	keys: {value: [{keyCode: "S".charCodeAt(0), ctrlKey:true, shiftKey:false}]}
});
MM.Command.Save.execute = function() {
	MM.App.io.quickSave();
}

MM.Command.SaveAs = Object.create(MM.Command, {
	label: {value: "Save as&hellip;"},
	keys: {value: [{keyCode: "S".charCodeAt(0), ctrlKey:true, shiftKey:true}]}
});
MM.Command.SaveAs.execute = function() {
	MM.App.io.show("save");
}

MM.Command.Load = Object.create(MM.Command, {
	label: {value: "Load map"},
	keys: {value: [{keyCode: "O".charCodeAt(0), ctrlKey:true}]}
});
MM.Command.Load.execute = function() {
	MM.App.io.show("load");
}

MM.Command.Center = Object.create(MM.Command, {
	label: {value: "Center map"},
	keys: {value: [{keyCode: 35}]}
});
MM.Command.Center.execute = function() {
	MM.App.map.center();
}

MM.Command.New = Object.create(MM.Command, {
	label: {value: "New map"},
	keys: {value: [{keyCode: "N".charCodeAt(0), ctrlKey:true}]}
});
MM.Command.New.execute = function() {
	if (!confirm("Throw away your current map and start a new one?")) { return; }
	var map = new MM.Map();
	MM.App.setMap(map);
	MM.publish("map-new", this);
}

MM.Command.ZoomIn = Object.create(MM.Command, {
	label: {value: "Zoom in"},
	keys: {value: [{charCode:"+".charCodeAt(0)}]}
});
MM.Command.ZoomIn.execute = function() {
	MM.App.adjustFontSize(1);
}

MM.Command.ZoomOut = Object.create(MM.Command, {
	label: {value: "Zoom out"},
	keys: {value: [{charCode:"-".charCodeAt(0)}]}
});
MM.Command.ZoomOut.execute = function() {
	MM.App.adjustFontSize(-1);
}

MM.Command.Help = Object.create(MM.Command, {
	label: {value: "Show/hide help"},
	keys: {value: [{charCode: "?".charCodeAt(0)}]}
});
MM.Command.Help.execute = function() {
	MM.App.help.toggle();
}

MM.Command.UI = Object.create(MM.Command, {
	label: {value: "Show/hide UI"},
	keys: {value: [{charCode: "*".charCodeAt(0)}]}
});
MM.Command.UI.execute = function() {
	MM.App.ui.toggle();
}

MM.Command.Pan = Object.create(MM.Command, {
	label: {value: "Pan the map"},
	keys: {value: [
		{keyCode: "W".charCodeAt(0), ctrlKey:false, altKey:false, metaKey:false},
		{keyCode: "A".charCodeAt(0), ctrlKey:false, altKey:false, metaKey:false},
		{keyCode: "S".charCodeAt(0), ctrlKey:false, altKey:false, metaKey:false},
		{keyCode: "D".charCodeAt(0), ctrlKey:false, altKey:false, metaKey:false}
	]},
	chars: {value: []}
});
MM.Command.Pan.execute = function(e) {
	var ch = String.fromCharCode(e.keyCode);
	var index = this.chars.indexOf(ch);
	if (index > -1) { return; }

	if (!this.chars.length) {
		window.addEventListener("keyup", this);
		this.interval = setInterval(this._step.bind(this), 50);
	}

	this.chars.push(ch);
	this._step();
}

MM.Command.Pan._step = function() {
	var dirs = {
		"W": [0, 1],
		"A": [1, 0],
		"S": [0, -1],
		"D": [-1, 0]
	}
	var offset = [0, 0];

	this.chars.forEach(function(ch) {
		offset[0] += dirs[ch][0];
		offset[1] += dirs[ch][1];
	});

	MM.App.map.moveBy(15*offset[0], 15*offset[1]);
}

MM.Command.Pan.handleEvent = function(e) {
	var ch = String.fromCharCode(e.keyCode);
	var index = this.chars.indexOf(ch);
	if (index > -1) {
		this.chars.splice(index, 1);
		if (!this.chars.length) {
			window.removeEventListener("keyup", this);
			clearInterval(this.interval);
		}
	}
}

MM.Command.Copy = Object.create(MM.Command, {
	label: {value: "Copy"},
	prevent: {value: false},
	keys: {value: [
		{keyCode: "C".charCodeAt(0), ctrlKey:true},
		{keyCode: "C".charCodeAt(0), metaKey:true}
	]}
});
MM.Command.Copy.execute = function() {
	MM.Clipboard.copy(MM.App.current);
}

MM.Command.Cut = Object.create(MM.Command, {
	label: {value: "Cut"},
	prevent: {value: false},
	keys: {value: [
		{keyCode: "X".charCodeAt(0), ctrlKey:true},
		{keyCode: "X".charCodeAt(0), metaKey:true}
	]}
});
MM.Command.Cut.execute = function() {
	MM.Clipboard.cut(MM.App.current);
}

MM.Command.Paste = Object.create(MM.Command, {
	label: {value: "Paste"},
	prevent: {value: false},
	keys: {value: [
		{keyCode: "V".charCodeAt(0), ctrlKey:true},
		{keyCode: "V".charCodeAt(0), metaKey:true}
	]}
});
MM.Command.Paste.execute = function() {
	MM.Clipboard.paste(MM.App.current);
}

MM.Command.Fold = Object.create(MM.Command, {
	label: {value: "Fold/Unfold"},
	keys: {value: [{charCode: "f".charCodeAt(0), ctrlKey:false}]}
});
MM.Command.Fold.execute = function() {
	var item = MM.App.current;
	if (item.isCollapsed()) { item.expand(); } else { item.collapse(); }
	MM.App.map.ensureItemVisibility(item);
}
MM.Command.Edit = Object.create(MM.Command, {
	label: {value: "Edit item"},
	keys: {value: [
		{keyCode: 32},
		{keyCode: 113}
	]}
});
MM.Command.Edit.execute = function() {
	MM.App.current.startEditing();
	MM.App.editing = true;
}

MM.Command.Finish = Object.create(MM.Command, {
	keys: {value: [{keyCode: 13, altKey:false, ctrlKey:false, shiftKey:false}]},
	editMode: {value: true}
});
MM.Command.Finish.execute = function() {
	MM.App.editing = false;
	var text = MM.App.current.stopEditing();
	if (text) {
		var action = new MM.Action.SetText(MM.App.current, text);
	} else {
		var action = new MM.Action.RemoveItem(MM.App.current);
	}
	MM.App.action(action);
}

MM.Command.Newline = Object.create(MM.Command, {
	label: {value: "Line break"},
	keys: {value: [
		{keyCode: 13, shiftKey:true},
		{keyCode: 13, ctrlKey:true}
	]},
	editMode: {value: true}
});
MM.Command.Newline.execute = function() {
	var range = getSelection().getRangeAt(0);
	var br = document.createElement("br");
	range.insertNode(br);
	range.setStartAfter(br);
	MM.App.current.updateSubtree();
}

MM.Command.Cancel = Object.create(MM.Command, {
	editMode: {value: true},
	keys: {value: [{keyCode: 27}]}
});
MM.Command.Cancel.execute = function() {
	MM.App.editing = false;
	MM.App.current.stopEditing();
	var oldText = MM.App.current.getText();
	if (!oldText) { /* newly added node */
		var action = new MM.Action.RemoveItem(MM.App.current);
		MM.App.action(action);
	}
}

MM.Command.Style = Object.create(MM.Command, {
	editMode: {value: null},
	command: {value: ""}
});

MM.Command.Style.execute = function() {
	if (MM.App.editing) {
		document.execCommand(this.command, null, null);
	} else {
		MM.Command.Edit.execute();
		var selection = getSelection();
		var range = selection.getRangeAt(0);
		range.selectNodeContents(MM.App.current.getDOM().text);
		selection.removeAllRanges();
		selection.addRange(range);
		this.execute();
		MM.Command.Finish.execute();
	}
}

MM.Command.Bold = Object.create(MM.Command.Style, {
	command: {value: "bold"},
	label: {value: "Bold"},
	keys: {value: [{keyCode: "B".charCodeAt(0), ctrlKey:true}]}
});

MM.Command.Underline = Object.create(MM.Command.Style, {
	command: {value: "underline"},
	label: {value: "Underline"},
	keys: {value: [{keyCode: "U".charCodeAt(0), ctrlKey:true}]}
});

MM.Command.Italic = Object.create(MM.Command.Style, {
	command: {value: "italic"},
	label: {value: "Italic"},
	keys: {value: [{keyCode: "I".charCodeAt(0), ctrlKey:true}]}
});

MM.Command.Strikethrough = Object.create(MM.Command.Style, {
	command: {value: "strikeThrough"},
	label: {value: "Strike-through"},
	keys: {value: [{keyCode: "S".charCodeAt(0), ctrlKey:true}]}
});

MM.Command.Value = Object.create(MM.Command, {
	label: {value: "Set value"},
	keys: {value: [{charCode: "v".charCodeAt(0), ctrlKey:false, metaKey:false}]}
});
MM.Command.Value.execute = function() {
	var item = MM.App.current;
	var oldValue = item.getValue();
	var newValue = prompt("Set item value", oldValue);
	if (newValue == null) { return; }

	if (!newValue.length) { newValue = null; }

	var numValue = parseFloat(newValue);
	var action = new MM.Action.SetValue(item, isNaN(numValue) ? newValue : numValue);
	MM.App.action(action);
}

MM.Command.Yes = Object.create(MM.Command, {
	label: {value: "Yes"},
	keys: {value: [{charCode: "y".charCodeAt(0), ctrlKey:false}]}
});
MM.Command.Yes.execute = function() {
	var item = MM.App.current;
	var status = (item.getStatus() == "yes" ? null : "yes");
	var action = new MM.Action.SetStatus(item, status);
	MM.App.action(action);
}

MM.Command.No = Object.create(MM.Command, {
	label: {value: "No"},
	keys: {value: [{charCode: "n".charCodeAt(0), ctrlKey:false}]}
});
MM.Command.No.execute = function() {
	var item = MM.App.current;
	var status = (item.getStatus() == "no" ? null : "no");
	var action = new MM.Action.SetStatus(item, status);
	MM.App.action(action);
}

MM.Command.Computed = Object.create(MM.Command, {
	label: {value: "Computed"},
	keys: {value: [{charCode: "c".charCodeAt(0), ctrlKey:false, metaKey:false}]}
});
MM.Command.Computed.execute = function() {
	var item = MM.App.current;
	var status = (item.getStatus() == "computed" ? null : "computed");
	var action = new MM.Action.SetStatus(item, status);
	MM.App.action(action);
}
MM.Command.Select = Object.create(MM.Command, {
	label: {value: "Move selection"},
	keys: {value: [
		{keyCode: 38, ctrlKey:false},
		{keyCode: 37, ctrlKey:false},
		{keyCode: 40, ctrlKey:false},
		{keyCode: 39, ctrlKey:false}
	]} 
});
MM.Command.Select.execute = function(e) {
	var dirs = {
		37: "left",
		38: "top",
		39: "right",
		40: "bottom"
	}
	var dir = dirs[e.keyCode];

	var layout = MM.App.current.getLayout();
	var item = /*MM.App.map*/layout.pick(MM.App.current, dir);
	MM.App.select(item);
}

MM.Command.SelectRoot = Object.create(MM.Command, {
	label: {value: "Select root"},
	keys: {value: [{keyCode: 36}]}
});
MM.Command.SelectRoot.execute = function() {
	var item = MM.App.current;
	while (!item.isRoot()) { item = item.getParent(); }
	MM.App.select(item);
}

MM.Command.SelectParent = Object.create(MM.Command, {
	label: {value: "Select parent"},
	keys: {value: [{keyCode: 8}]}
});
MM.Command.SelectParent.execute = function() {
	if (MM.App.current.isRoot()) { return; }
	MM.App.select(MM.App.current.getParent());
}

MM.Layout = Object.create(MM.Repo, {
	ALL: {value: []},
	SPACING_RANK: {value: 4},
	SPACING_CHILD: {value: 4},
});

MM.Layout.getAll = function() {
	return this.ALL;
}

/**
 * Re-draw an item and its children
 */
MM.Layout.update = function(item) {
	return this;
}

/**
 * @param {MM.Item} child Child node (its parent uses this layout)
 */
MM.Layout.getChildDirection = function(child) {
	return "";
}

MM.Layout.pick = function(item, dir) {
	var opposite = {
		left: "right",
		right: "left",
		top: "bottom",
		bottom: "top"
	}
	
	/* direction for a child */
	if (!item.isCollapsed()) {
		var children = item.getChildren();
		for (var i=0;i<children.length;i++) {
			var child = children[i];
			if (this.getChildDirection(child) == dir) { return child; }
		}
	}

	if (item.isRoot()) { return item; }
	
	var parentLayout = item.getParent().getLayout();
	var thisChildDirection = parentLayout.getChildDirection(item);
	if (thisChildDirection == dir) {
		return item;
	} else if (thisChildDirection == opposite[dir]) {
		return item.getParent();
	} else {
		return parentLayout.pickSibling(item, (dir == "left" || dir == "top" ? -1 : +1));
	}
}

MM.Layout.pickSibling = function(item, dir) {
	if (item.isRoot()) { return item; }

	var children = item.getParent().getChildren();
	var index = children.indexOf(item);
	index += dir;
	index = (index+children.length) % children.length;
	return children[index];
}

/**
 * Adjust canvas size and position
 */
MM.Layout._anchorCanvas = function(item) {
	var dom = item.getDOM();
	dom.canvas.width = dom.node.offsetWidth;
	dom.canvas.height = dom.node.offsetHeight;
}

MM.Layout._anchorToggle = function(item, x, y, side) {
	var node = item.getDOM().toggle;
	var w = node.offsetWidth;
	var h = node.offsetHeight;
	var l = x;
	var t = y;

	switch (side) {
		case "left":
			t -= h/2;
			l -= w;
		break;

		case "right":
			t -= h/2;
		break;
		
		case "top":
			l -= w/2;
			t -= h;
		break;

		case "bottom":
			l -= w/2;
		break;
	}
	
	node.style.left = Math.round(l) + "px";
	node.style.top = Math.round(t) + "px";
}

MM.Layout._getChildAnchor = function(item, side) {
	var dom = item.getDOM();
	if (side == "left" || side == "right") {
		var pos = dom.node.offsetLeft + dom.content.offsetLeft;
		if (side == "left") { pos += dom.content.offsetWidth; }
	} else {
		var pos = dom.node.offsetTop + dom.content.offsetTop;
		if (side == "top") { pos += dom.content.offsetHeight; }
	}
	return pos;
}

MM.Layout._computeChildrenBBox = function(children, childIndex) {
	var bbox = [0, 0];
	var rankIndex = (childIndex+1) % 2;

	children.forEach(function(child, index) {
		var node = child.getDOM().node;
		var childSize = [node.offsetWidth, node.offsetHeight];

		bbox[rankIndex] = Math.max(bbox[rankIndex], childSize[rankIndex]); /* adjust cardinal size */
		bbox[childIndex] += childSize[childIndex]; /* adjust orthogonal size */
	}, this);

	if (children.length > 1) { bbox[childIndex] += this.SPACING_CHILD * (children.length-1); } /* child separation */

	return bbox;
}

MM.Layout._alignItem = function(item, side) {
	var dom = item.getDOM();

	switch (side) {
		case "left":
			dom.content.insertBefore(dom.icon, dom.content.firstChild);
			dom.content.appendChild(dom.value);
			dom.content.appendChild(dom.status);
		break;
		case "right":
			dom.content.insertBefore(dom.icon, dom.content.firstChild);
			dom.content.insertBefore(dom.value, dom.content.firstChild);
			dom.content.insertBefore(dom.status, dom.content.firstChild);
		break;
	}
}
MM.Layout.Graph = Object.create(MM.Layout, {
	SPACING_RANK: {value: 16},
	childDirection: {value: ""}
});

MM.Layout.Graph.getChildDirection = function(child) {
	return this.childDirection;
}

MM.Layout.Graph.create = function(direction, id, label) {
	var layout = Object.create(this, {
		childDirection: {value:direction},
		id: {value:id},
		label: {value:label}
	});
	MM.Layout.ALL.push(layout);
	return layout;
}

MM.Layout.Graph.update = function(item) {
	var side = this.childDirection;
	if (!item.isRoot()) {
		side = item.getParent().getLayout().getChildDirection(item);
	}
	this._alignItem(item, side);

	this._layoutItem(item, this.childDirection);

	if (this.childDirection == "left" || this.childDirection == "right") {
		this._drawLinesHorizontal(item, this.childDirection);
	} else {
		this._drawLinesVertical(item, this.childDirection);
	}

	return this;
}


/**
 * Generic graph child layout routine. Updates item's orthogonal size according to the sum of its children.
 */
MM.Layout.Graph._layoutItem = function(item, rankDirection) {
	var sizeProps = ["width", "height"];
	var posProps = ["left", "top"];
	var rankIndex = (rankDirection == "left" || rankDirection == "right" ? 0 : 1);
	var childIndex = (rankIndex+1) % 2;

	var rankPosProp = posProps[rankIndex];
	var childPosProp = posProps[childIndex];
	var rankSizeProp = sizeProps[rankIndex];
	var childSizeProp = sizeProps[childIndex];

	var dom = item.getDOM();

	/* content size */
	var contentSize = [dom.content.offsetWidth, dom.content.offsetHeight];

	/* children size */
	var bbox = this._computeChildrenBBox(item.getChildren(), childIndex);

	/* node size */
	var rankSize = contentSize[rankIndex];
	if (bbox[rankIndex]) { rankSize += bbox[rankIndex] + this.SPACING_RANK; }
	var childSize = Math.max(bbox[childIndex], contentSize[childIndex]);
	dom.node.style[rankSizeProp] = rankSize + "px";
	dom.node.style[childSizeProp] = childSize + "px";

	var offset = [0, 0];
	if (rankDirection == "right") { offset[0] = contentSize[0] + this.SPACING_RANK; }
	if (rankDirection == "bottom") { offset[1] = contentSize[1] + this.SPACING_RANK; }
	offset[childIndex] = Math.round((childSize - bbox[childIndex])/2);
	this._layoutChildren(item.getChildren(), rankDirection, offset, bbox);

	/* label position */
	var labelPos = 0;
	if (rankDirection == "left") { labelPos = rankSize - contentSize[0]; }
	if (rankDirection == "top") { labelPos = rankSize - contentSize[1]; }
	dom.content.style[childPosProp] = Math.round((childSize - contentSize[childIndex])/2) + "px";
	dom.content.style[rankPosProp] = labelPos + "px";

	return this;
}

MM.Layout.Graph._layoutChildren = function(children, rankDirection, offset, bbox) {
	var posProps = ["left", "top"];

	var rankIndex = (rankDirection == "left" || rankDirection == "right" ? 0 : 1);
	var childIndex = (rankIndex+1) % 2;
	var rankPosProp = posProps[rankIndex];
	var childPosProp = posProps[childIndex];

	children.forEach(function(child, index) {
		var node = child.getDOM().node;
		var childSize = [node.offsetWidth, node.offsetHeight];

		if (rankDirection == "left") { offset[0] = bbox[0] - childSize[0]; }
		if (rankDirection == "top") { offset[1] = bbox[1] - childSize[1]; }

		node.style[childPosProp] = offset[childIndex] + "px";
		node.style[rankPosProp] = offset[rankIndex] + "px";

		offset[childIndex] += childSize[childIndex] + this.SPACING_CHILD; /* offset for next child */
	}, this);

	return bbox;
}

MM.Layout.Graph._drawLinesHorizontal = function(item, side) {
	this._anchorCanvas(item);
	this._drawHorizontalConnectors(item, side, item.getChildren());
}

MM.Layout.Graph._drawLinesVertical = function(item, side) {
	this._anchorCanvas(item);
	this._drawVerticalConnectors(item, side, item.getChildren());
}

MM.Layout.Graph._drawHorizontalConnectors = function(item, side, children) {
	if (children.length == 0) { return; }

	var dom = item.getDOM();
	var canvas = dom.canvas;
	var ctx = canvas.getContext("2d");
	ctx.strokeStyle = item.getColor();
	var R = this.SPACING_RANK/2;

	/* first part */
	var y1 = item.getShape().getVerticalAnchor(item);
	if (side == "left") {
		var x1 = dom.content.offsetLeft - 0.5;
	} else {
		var x1 = dom.content.offsetWidth + dom.content.offsetLeft + 0.5;
	}
	
	this._anchorToggle(item, x1, y1, side);
	if (item.isCollapsed()) { return; }

	if (children.length == 1) {
		var child = children[0];
		var y2 = child.getShape().getVerticalAnchor(child) + child.getDOM().node.offsetTop;
		var x2 = this._getChildAnchor(child, side);
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.bezierCurveTo((x1+x2)/2, y1, (x1+x2)/2, y2, x2, y2);
		ctx.stroke();
		return;
	}

	if (side == "left") {
		var x2 = x1 - R;
	} else {
		var x2 = x1 + R;
	}

	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y1);
	ctx.stroke();

	/* rounded connectors */
	var c1 = children[0];
	var c2 = children[children.length-1];
 	var x = x2;
 	var xx = x + (side == "left" ? -R : R);

	var y1 = c1.getShape().getVerticalAnchor(c1) + c1.getDOM().node.offsetTop;
	var y2 = c2.getShape().getVerticalAnchor(c2) + c2.getDOM().node.offsetTop;
	var x1 = this._getChildAnchor(c1, side);
	var x2 = this._getChildAnchor(c2, side);

	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(xx, y1)
	ctx.arcTo(x, y1, x, y1+R, R);
	ctx.lineTo(x, y2-R);
	ctx.arcTo(x, y2, xx, y2, R);
	ctx.lineTo(x2, y2);

	for (var i=1; i<children.length-1; i++) {
		var c = children[i];
		var y = c.getShape().getVerticalAnchor(c) + c.getDOM().node.offsetTop;
		ctx.moveTo(x, y);
		ctx.lineTo(this._getChildAnchor(c, side), y);
	}
	ctx.stroke();
}

MM.Layout.Graph._drawVerticalConnectors = function(item, side, children) {
	if (children.length == 0) { return; }

	var dom = item.getDOM();
	var canvas = dom.canvas;
	var ctx = canvas.getContext("2d");
	ctx.strokeStyle = item.getColor();

	/* first part */
	var R = this.SPACING_RANK/2;
	
	var x = item.getShape().getHorizontalAnchor(item);
	var height = (children.length == 1 ? 2*R : R);

	if (side == "top") {
		var y1 = canvas.height - dom.content.offsetHeight;
		var y2 = y1 - height;
		this._anchorToggle(item, x, y1, side);
	} else {
		var y1 = item.getShape().getVerticalAnchor(item);
		var y2 = dom.content.offsetHeight + height;
		this._anchorToggle(item, x, dom.content.offsetHeight, side);
	}

	ctx.beginPath();
	ctx.moveTo(x, y1);
	ctx.lineTo(x, y2);
	ctx.stroke();


	if (children.length == 1) { return; }

	/* rounded connectors */
	var c1 = children[0];
	var c2 = children[children.length-1];
	var offset = dom.content.offsetHeight + height;
	var y = Math.round(side == "top" ? canvas.height - offset : offset) + 0.5;

	var x1 = c1.getShape().getHorizontalAnchor(c1) + c1.getDOM().node.offsetLeft;
	var x2 = c2.getShape().getHorizontalAnchor(c2) + c2.getDOM().node.offsetLeft;
	var y1 = this._getChildAnchor(c1, side);
	var y2 = this._getChildAnchor(c2, side);

	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.arcTo(x1, y, x1+R, y, R);
	ctx.lineTo(x2-R, y);
	ctx.arcTo(x2, y, x2, y2, R);

	for (var i=1; i<children.length-1; i++) {
		var c = children[i];
		var x = c.getShape().getHorizontalAnchor(c) + c.getDOM().node.offsetLeft;
		ctx.moveTo(x, y);
		ctx.lineTo(x, this._getChildAnchor(c, side));
	}
	ctx.stroke();
}


MM.Layout.Graph.Down = MM.Layout.Graph.create("bottom", "graph-bottom", "Bottom");
MM.Layout.Graph.Up = MM.Layout.Graph.create("top", "graph-top", "Top");
MM.Layout.Graph.Left = MM.Layout.Graph.create("left", "graph-left", "Left");
MM.Layout.Graph.Right = MM.Layout.Graph.create("right", "graph-right", "Right");
MM.Layout.Tree = Object.create(MM.Layout, {
	SPACING_RANK: {value: 32},
	childDirection: {value: ""}
});

MM.Layout.Tree.getChildDirection = function(child) {
	return this.childDirection;
}

MM.Layout.Tree.create = function(direction, id, label) {
	var layout = Object.create(this, {
		childDirection: {value:direction},
		id: {value:id},
		label: {value:label}
	});
	MM.Layout.ALL.push(layout);
	return layout;
}

MM.Layout.Tree.update = function(item) {
	var side = this.childDirection;
	if (!item.isRoot()) {
		side = item.getParent().getLayout().getChildDirection(item);
	}
	this._alignItem(item, side);

	this._layoutItem(item, this.childDirection);
	this._anchorCanvas(item);
	this._drawLines(item, this.childDirection);
	return this;
}

/**
 * Generic graph child layout routine. Updates item's orthogonal size according to the sum of its children.
 */
MM.Layout.Tree._layoutItem = function(item, rankDirection) {
	var dom = item.getDOM();

	/* content size */
	var contentSize = [dom.content.offsetWidth, dom.content.offsetHeight];

	/* children size */
	var bbox = this._computeChildrenBBox(item.getChildren(), 1);

	/* node size */
	var rankSize = contentSize[0];
	var childSize = bbox[1] + contentSize[1];
	if (bbox[0]) { 
		rankSize = Math.max(rankSize, bbox[0] + this.SPACING_RANK); 
		childSize += this.SPACING_CHILD;
	}
	dom.node.style.width = rankSize + "px";
	dom.node.style.height = childSize + "px";

	var offset = [this.SPACING_RANK, contentSize[1]+this.SPACING_CHILD];
	if (rankDirection == "left") { offset[0] = rankSize - bbox[0] - this.SPACING_RANK; }
	this._layoutChildren(item.getChildren(), rankDirection, offset, bbox);

	/* label position */
	var labelPos = 0;
	if (rankDirection == "left") { labelPos = rankSize - contentSize[0]; }
	dom.content.style.left = labelPos + "px";
	dom.content.style.top = 0;

	return this;
}

MM.Layout.Tree._layoutChildren = function(children, rankDirection, offset, bbox) {
	children.forEach(function(child, index) {
		var node = child.getDOM().node;
		var childSize = [node.offsetWidth, node.offsetHeight];
		var left = offset[0];
		if (rankDirection == "left") { left += (bbox[0] - childSize[0]); }

		node.style.left = left + "px";
		node.style.top = offset[1] + "px";

		offset[1] += childSize[1] + this.SPACING_CHILD; /* offset for next child */
	}, this);

	return bbox;
}

MM.Layout.Tree._drawLines = function(item, side) {
	var dom = item.getDOM();
	var canvas = dom.canvas;

	var R = this.SPACING_RANK/4;
	var x = (side == "left" ? canvas.width - 2*R : 2*R) + 0.5;
	this._anchorToggle(item, x, dom.content.offsetHeight, "bottom");

	var children = item.getChildren();
	if (children.length == 0 || item.isCollapsed()) { return; }

	var ctx = canvas.getContext("2d");
	ctx.strokeStyle = item.getColor();

	var y1 = item.getShape().getVerticalAnchor(item);
	var last = children[children.length-1];
	var y2 = last.getShape().getVerticalAnchor(last) + last.getDOM().node.offsetTop;

	ctx.beginPath();
	ctx.moveTo(x, y1);
	ctx.lineTo(x, y2 - R);

	/* rounded connectors */
	for (var i=0; i<children.length; i++) {
		var c = children[i];
		var y = c.getShape().getVerticalAnchor(c) + c.getDOM().node.offsetTop;
		var anchor = this._getChildAnchor(c, side);

		ctx.moveTo(x, y - R);
		ctx.arcTo(x, y, anchor, y, R);
		ctx.lineTo(anchor, y);
	}
	ctx.stroke();
}

MM.Layout.Tree.Left = MM.Layout.Tree.create("left", "tree-left", "Left");
MM.Layout.Tree.Right = MM.Layout.Tree.create("right", "tree-right", "Right");
MM.Layout.Map = Object.create(MM.Layout.Graph, {
	id: {value:"map"},
	label: {value:"Map"},
	LINE_THICKNESS: {value:8}
});
MM.Layout.ALL.push(MM.Layout.Map);

MM.Layout.Map.update = function(item) {
	if (item.isRoot()) {
		this._layoutRoot(item);
	} else {
		var side = this.getChildDirection(item);
		var name = side.charAt(0).toUpperCase() + side.substring(1);
		MM.Layout.Graph[name].update(item);
	}
}

/**
 * @param {MM.Item} child Child node
 */
MM.Layout.Map.getChildDirection = function(child) {
	while (!child.getParent().isRoot()) {
		child = child.getParent();
	}
	/* child is now the sub-root node */

	var side = child.getSide();
	if (side) { return side; }

	var counts = {left:0, right:0};
	var children = child.getParent().getChildren();
	for (var i=0;i<children.length;i++) {
		var side = children[i].getSide();
		if (!side) {
			side = (counts.right > counts.left ? "left" : "right");
			children[i].setSide(side);
		}
		counts[side]++;
	}

	return child.getSide();
}

MM.Layout.Map.pickSibling = function(item, dir) {
	if (item.isRoot()) { return item; }

	var parent = item.getParent();
	var children = parent.getChildren();
	if (parent.isRoot()) {
		var side = this.getChildDirection(item);
		children = children.filter(function(child) {
			return (this.getChildDirection(child) == side);
		}, this);
	}
	
	var index = children.indexOf(item);
	index += dir;
	index = (index+children.length) % children.length;
	return children[index];
}

MM.Layout.Map._layoutRoot = function(item) {
	this._alignItem(item, "right");

	var dom = item.getDOM();

	var children = item.getChildren();
	var childrenLeft = [];
	var childrenRight = [];

	children.forEach(function(child, index) {
		var node = child.getDOM().node;
		var side = this.getChildDirection(child);
		
		if (side == "left") {
			childrenLeft.push(child);
		} else {
			childrenRight.push(child);
		}
	}, this);

	var bboxLeft = this._computeChildrenBBox(childrenLeft, 1);
	var bboxRight = this._computeChildrenBBox(childrenRight, 1);
	var height = Math.max(bboxLeft[1], bboxRight[1], dom.content.offsetHeight);

	var left = 0;
	this._layoutChildren(childrenLeft, "left", [left, Math.round((height-bboxLeft[1])/2)], bboxLeft);
	left += bboxLeft[0];

	if (childrenLeft.length) { left += this.SPACING_RANK; }
	dom.content.style.left = left + "px";
	left += dom.content.offsetWidth;

	if (childrenRight.length) { left += this.SPACING_RANK; }
	this._layoutChildren(childrenRight, "right", [left, Math.round((height-bboxRight[1])/2)], bboxRight);
	left += bboxRight[0];

	dom.content.style.top = Math.round((height - dom.content.offsetHeight)/2) + "px";
	dom.node.style.height = height + "px";
	dom.node.style.width = left + "px";

	this._anchorCanvas(item);
	this._drawRootConnectors(item, "left", childrenLeft);
	this._drawRootConnectors(item, "right", childrenRight);
}

MM.Layout.Map._drawRootConnectors = function(item, side, children) {
	if (children.length == 0 || item.isCollapsed()) { return; }

	var dom = item.getDOM();
	var canvas = dom.canvas;
	var ctx = canvas.getContext("2d");
	var R = this.SPACING_RANK/2;

	var x1 = dom.content.offsetLeft + dom.content.offsetWidth/2;
	var y1 = item.getShape().getVerticalAnchor(item);
	var half = this.LINE_THICKNESS/2;

	for (var i=0;i<children.length;i++) {
		var child = children[i];

		var x2 = this._getChildAnchor(child, side);
		var y2 = child.getShape().getVerticalAnchor(child) + child.getDOM().node.offsetTop;
		var angle = Math.atan2(y2-y1, x2-x1) + Math.PI/2;
		var dx = Math.cos(angle) * half;
		var dy = Math.sin(angle) * half;

		ctx.fillStyle = ctx.strokeStyle = child.getColor();
		ctx.beginPath();
		ctx.moveTo(x1-dx, y1-dy);
		ctx.quadraticCurveTo((x2+x1)/2, y2, x2, y2);
		ctx.quadraticCurveTo((x2+x1)/2, y2, x1+dx, y1+dy);
		ctx.fill();
		ctx.stroke();
	}

}
MM.Shape = Object.create(MM.Repo, {
	VERTICAL_OFFSET: {value: 0.5},
});

MM.Shape.set = function(item) {
	item.getDOM().node.classList.add("shape-"+this.id);
	return this;
}

MM.Shape.unset = function(item) {
	item.getDOM().node.classList.remove("shape-"+this.id);
	return this;
}

MM.Shape.update = function(item) {
	item.getDOM().content.style.borderColor = item.getColor();
	return this;
}

MM.Shape.getHorizontalAnchor = function(item) {
	var node = item.getDOM().content;
	return Math.round(node.offsetLeft + node.offsetWidth/2) + 0.5;
}

MM.Shape.getVerticalAnchor = function(item) {
	var node = item.getDOM().content;
	return node.offsetTop + Math.round(node.offsetHeight * this.VERTICAL_OFFSET) + 0.5;
}
MM.Shape.Underline = Object.create(MM.Shape, {
	id: {value: "underline"},
	label: {value: "Underline"},
	VERTICAL_OFFSET: {value: -3}
});

MM.Shape.Underline.update = function(item) {
	var dom = item.getDOM();

	var ctx = dom.canvas.getContext("2d");
	ctx.strokeStyle = item.getColor();

	var left = dom.content.offsetLeft;
	var right = left + dom.content.offsetWidth;

	var top = this.getVerticalAnchor(item);

	ctx.beginPath();
	ctx.moveTo(left, top);
	ctx.lineTo(right, top);
	ctx.stroke();
}

MM.Shape.Underline.getVerticalAnchor = function(item) {
	var node = item.getDOM().content;
	return node.offsetTop + node.offsetHeight + this.VERTICAL_OFFSET + 0.5;
}
MM.Shape.Box = Object.create(MM.Shape, {
	id: {value: "box"},
	label: {value: "Box"}
});
MM.Shape.Ellipse = Object.create(MM.Shape, {
	id: {value: "ellipse"},
	label: {value: "Ellipse"}
});
MM.Format = Object.create(MM.Repo, {
	extension: {value:""},
	mime: {value:""}
});

MM.Format.getByName = function(name) {
	var index = name.lastIndexOf(".");
	if (index == -1) { return null; }
	var extension = name.substring(index+1).toLowerCase(); 
	return this.getByProperty("extension", extension);
}

MM.Format.getByMime = function(mime) {
	return this.getByProperty("mime", mime);
}

MM.Format.to = function(data) {}
MM.Format.from = function(data) {}

MM.Format.nl2br = function(str) {
	return str.replace(/\n/g, "<br/>");
}

MM.Format.br2nl = function(str) {
	return str.replace(/<br\s*\/?>/g, "\n");
}
MM.Format.JSON = Object.create(MM.Format, {
	id: {value: "json"},
	label: {value: "Native (JSON)"},
	extension: {value: "mymind"},
	mime: {value: "application/vnd.mymind+json"}
});

MM.Format.JSON.to = function(data) { 
	return JSON.stringify(data, null, "\t") + "\n";
}

MM.Format.JSON.from = function(data) {
	return JSON.parse(data);
}
MM.Format.FreeMind = Object.create(MM.Format, {
	id: {value: "freemind"},
	label: {value: "FreeMind"},
	extension: {value: "mm"},
	mime: {value: "application/x-freemind"}
});

MM.Format.FreeMind.to = function(data) {
	var doc = document.implementation.createDocument("", "", null);
	var map = doc.createElement("map");

	map.setAttribute("version", "0.9.0");
	map.appendChild(this._serializeItem(doc, data.root));

	doc.appendChild(map);
	var serializer = new XMLSerializer();
	return serializer.serializeToString(doc);
}

MM.Format.FreeMind.from = function(data) {
	var parser = new DOMParser();
	var doc = parser.parseFromString(data, "application/xml");
	if (doc.documentElement.nodeName.toLowerCase() == "parsererror") { throw new Error(doc.documentElement.textContent); }

	var root = doc.documentElement.getElementsByTagName("node")[0];
	if (!root) { throw new Error("No root node found"); }

	var json = {
		root: this._parseNode(root, {shape:"underline"})
	};
	json.root.layout = "map";
	json.root.shape = "ellipse";

	return json;
}

MM.Format.FreeMind._serializeItem = function(doc, json) {
	var elm = this._serializeAttributes(doc, json);

	(json.children || []).forEach(function(child) {
		elm.appendChild(this._serializeItem(doc, child));
	}, this);

	return elm;
}

MM.Format.FreeMind._serializeAttributes = function(doc, json) {
	var elm = doc.createElement("node");
	elm.setAttribute("TEXT", MM.Format.br2nl(json.text));
	elm.setAttribute("ID", json.id);

	if (json.side) { elm.setAttribute("POSITION", json.side); }
	if (json.shape == "box") { elm.setAttribute("STYLE", "bubble"); }
	if (json.collapsed) { elm.setAttribute("FOLDED", "true"); }

	return elm;
}

MM.Format.FreeMind._parseNode = function(node, parent) {
	var json = this._parseAttributes(node, parent);

	for (var i=0;i<node.childNodes.length;i++) {
		var child = node.childNodes[i];
		if (child.nodeName.toLowerCase() == "node") {
			json.children.push(this._parseNode(child, json));
		}
	}

	return json;
}

MM.Format.FreeMind._parseAttributes = function(node, parent) {
	var json = {
		children: [],
		text: MM.Format.nl2br(node.getAttribute("TEXT") || ""),
		id: node.getAttribute("ID")
	};

	var position = node.getAttribute("POSITION");
	if (position) { json.side = position; }

	var style = node.getAttribute("STYLE");
	if (style == "bubble") {
		json.shape = "box";
	} else {
		json.shape = parent.shape;
	}

	if (node.getAttribute("FOLDED") == "true") { json.collapsed = 1; }

	var children = node.children;
	for (var i=0;i<children.length;i++) {
		var child = children[i];
		switch (child.nodeName.toLowerCase()) {
			case "richcontent":
				var body = child.querySelector("body > *");
				if (body) {
					var serializer = new XMLSerializer();
					json.text = serializer.serializeToString(body).trim();
				}
			break;

			case "font":
				if (child.getAttribute("ITALIC") == "true") { json.text = "<i>" + json.text + "</i>"; }
				if (child.getAttribute("BOLD") == "true") { json.text = "<b>" + json.text + "</b>"; }
			break;
		}
	}

	return json;
}
MM.Format.MMA = Object.create(MM.Format.FreeMind, {
	id: {value: "mma"},
	label: {value: "Mind Map Architect"},
	extension: {value: "mma"}
});

MM.Format.MMA._parseAttributes = function(node, parent) {
	var json = {
		children: [],
		text: MM.Format.nl2br(node.getAttribute("title") || ""),
		shape: "box"
	};

	if (node.getAttribute("expand") == "false") { json.collapsed = 1; }

	var direction = node.getAttribute("direction");
	if (direction == "0") { json.side = "left"; }
	if (direction == "1") { json.side = "right"; }

	var color = node.getAttribute("color");
	if (color) {
		var re = color.match(/^#(....)(....)(....)$/);
		if (re) {
			var r = parseInt(re[1], 16) >> 8;
			var g = parseInt(re[2], 16) >> 8;
			var b = parseInt(re[3], 16) >> 8;
			r = Math.round(r/17).toString(16);
			g = Math.round(g/17).toString(16);
			b = Math.round(b/17).toString(16);
		}
		json.color = "#" + [r,g,b].join("");
	}

	json.icon = node.getAttribute("icon");

	return json;
}

MM.Format.MMA._serializeAttributes = function(doc, json) {
	var elm = doc.createElement("node");
	elm.setAttribute("title", MM.Format.br2nl(json.text));
	elm.setAttribute("expand", json.collapsed ? "false" : "true");

	if (json.side) { elm.setAttribute("direction", json.side == "left" ? "0" : "1"); }
	if (json.color) {
		var parts = json.color.match(/^#(.)(.)(.)$/);
		var r = new Array(5).join(parts[1]);
		var g = new Array(5).join(parts[2]);
		var b = new Array(5).join(parts[3]);
		elm.setAttribute("color", "#" + [r,g,b].join(""));
	}
	if (json.icon) {
		elm.setAttribute("icon", json.icon);
	}

	return elm;
}
MM.Format.Mup = Object.create(MM.Format, {
	id: {value: "mup"},
	label: {value: "MindMup"},
	extension: {value: "mup"}
});

MM.Format.Mup.to = function(data) {
	var root = this._MMtoMup(data.root);
	return JSON.stringify(root, null, 2);
}

MM.Format.Mup.from = function(data) {
	var source = JSON.parse(data);
	var root = this._MupToMM(source);
	root.layout = "map";

	var map = {
		root: root
	}

	return map;
}

MM.Format.Mup._MupToMM = function(item) {
	var json = {
		text: MM.Format.nl2br(item.title),
		id: item.id,
		shape: "box",
		icon: item.icon
	}

	if (item.attr && item.attr.style && item.attr.style.background) {
		json.color = item.attr.style.background;
	}

	if (item.attr && item.attr.collapsed) {
		json.collapsed = 1;
	}

	if (item.ideas) {
		var data = [];
		for (var key in item.ideas) {
			var child = this._MupToMM(item.ideas[key]);
			var num = parseFloat(key);
			child.side = (num < 0 ? "left" : "right");
			data.push({
				child: child,
				num: num
			});
		}

		data.sort(function(a, b) {
			return a.num-b.num;
		});

		json.children = data.map(function(item) { return item.child; });
	}

	return json;
}

MM.Format.Mup._MMtoMup = function(item, side) {
	var result = {
		id: item.id,
		title: MM.Format.br2nl(item.text),
		icon: item.icon,
		attr: {}
	}
	if (item.color) {
		result.attr.style = {background:item.color};
	}
	if (item.collapsed) {
		result.attr.collapsed = true;
	}

	if (item.children) {
		result.ideas = {};

		for (var i=0;i<item.children.length;i++) {
			var child = item.children[i];
			var childSide = side || child.side;

			var key = i+1;
			if (childSide == "left") { key *= -1; }

			result.ideas[key] = this._MMtoMup(child, childSide);
		}
	}

	return result;
}
MM.Format.Plaintext = Object.create(MM.Format, {
	id: {value: "plaintext"},
	label: {value: "Plain text"},
	extension: {value: "txt"},
	mime: {value: "application/vnd.mymind+txt"}
});

/**
 * Can serialize also a sub-tree
 */
MM.Format.Plaintext.to = function(data) {
	return this._serializeItem(data.root || data);
}

MM.Format.Plaintext.from = function(data) {
	var lines = data.split("\n").filter(function(line) {
		return line.match(/\S/);
	});

	var items = this._parseItems(lines);

	if (items.length == 1) {
		var result = {
			root: items[0]
		}
	} else {
		var result = {
			root: {
				text: "",
				children: items
			}
		}
	}
	result.root.layout = "map";

	return result;
}

MM.Format.Plaintext._serializeItem = function(item, depth) {
	depth = depth || 0;

	var lines = (item.children || []) .map(function(child) {
		return this._serializeItem(child, depth+1);
	}, this);

	var prefix = new Array(depth+1).join("\t");
	lines.unshift(prefix + item.text.replace(/\n/g, ""));

	return lines.join("\n") + (depth ? "" : "\n");
}


MM.Format.Plaintext._parseItems = function(lines) {
	var items = [];
	if (!lines.length) { return items; }
	var firstPrefix = this._parsePrefix(lines[0]);

	var currentItem = null;
	var childLines = [];

	/* finalize a block of sub-children by converting them to items and appending */
	var convertChildLinesToChildren = function() { 
		if (!currentItem || !childLines.length) { return; }
		var children = this._parseItems(childLines);
		if (children.length) { currentItem.children = children; }
		childLines = [];
	}

	lines.forEach(function(line, index) {
		if (this._parsePrefix(line) == firstPrefix) { /* new top-level item! */
			convertChildLinesToChildren.call(this); /* finalize previous item */
			currentItem = {text:line.match(/^\s*(.*)/)[1]};
			items.push(currentItem);
		} else { /* prepare as a future child */
			childLines.push(line);
		}
	}, this);

	convertChildLinesToChildren.call(this);

	return items;
}

MM.Format.Plaintext._parsePrefix = function(line) {
	return line.match(/^\s*/)[0];
}
MM.Backend = Object.create(MM.Repo);

/**
 * Backends are allowed to have some internal state. 
 * This method notifies them that "their" map is no longer used 
 * (was either replaced by a new one or saved using other backend).
 */ 
MM.Backend.reset = function() {
}

MM.Backend.save = function(data, name) {
}

MM.Backend.load = function(name) {
}
MM.Backend.Local = Object.create(MM.Backend, {
	label: {value: "Browser storage"},
	id: {value: "local"},
	prefix: {value: "mm.map."}
});

MM.Backend.Local.save = function(data, id, name) {
	localStorage.setItem(this.prefix + id, data);

	var names = this.list();
	names[id] = name;
	localStorage.setItem(this.prefix + "names", JSON.stringify(names));
}

MM.Backend.Local.load = function(id) {
	var data = localStorage.getItem(this.prefix + id);
	if (!data) { throw new Error("There is no such saved map"); }
	return data;
}

MM.Backend.Local.remove = function(id) {
	localStorage.removeItem(this.prefix + id);

	var names = this.list();
	delete names[id];
	localStorage.setItem(this.prefix + "names", JSON.stringify(names));
}

MM.Backend.Local.list = function() {
	try {
		var data = localStorage.getItem(this.prefix + "names") || "{}";
		return JSON.parse(data);
	} catch (e) {
		return {};
	}
}
MM.Backend.WebDAV = Object.create(MM.Backend, {
	id: {value: "webdav"},
	label: {value: "Generic WebDAV"}
});

MM.Backend.WebDAV.save = function(data, url) {
	return this._request("put", url, data);
}

MM.Backend.WebDAV.load = function(url) {
	return this._request("get", url);
}

MM.Backend.WebDAV._request = function(method, url, data) {
	var xhr = new XMLHttpRequest();
	xhr.open(method, url, true);
	xhr.withCredentials = true;

	var promise = new Promise();
	
	Promise.send(xhr, data).then(
		function(xhr) { promise.fulfill(xhr.responseText); },
		function(xhr) { promise.reject(new Error("HTTP/" + xhr.status + "\n\n" + xhr.responseText)); }
	);

	return promise;
}
MM.Backend.Image = Object.create(MM.Backend, {
	id: {value: "image"},
	label: {value: "Image"},
	url: {value:"", writable:true}
});

MM.Backend.Image.save = function(data, name) {
	var form = document.createElement("form");
	form.action = this.url;
	form.method = "post";
	form.target = "_blank";

	var input = document.createElement("input");
	input.type = "hidden";
	input.name = "data";
	input.value = data;
	form.appendChild(input);

	var input = document.createElement("input");
	input.type = "hidden";
	input.name = "name";
	input.value = name;
	form.appendChild(input);

	document.body.appendChild(form);
	form.submit();
	form.parentNode.removeChild(form);
}
MM.Backend.File = Object.create(MM.Backend, {
	id: {value: "file"},
	label: {value: "File"},
	input: {value:document.createElement("input")}
});

MM.Backend.File.save = function(data, name) {
	var link = document.createElement("a");
	link.download = name;
	link.href = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(data)));
	document.body.appendChild(link);
	link.click();
	link.parentNode.removeChild(link);

	var promise = new Promise().fulfill();
	return promise;
}

MM.Backend.File.load = function() {
	var promise = new Promise();

	this.input.type = "file";

	this.input.onchange = function(e) {
		var file = e.target.files[0];
		if (!file) { return; }

		var reader = new FileReader();
		reader.onload = function() { promise.fulfill({data:reader.result, name:file.name}); }
		reader.onerror = function() { promise.reject(reader.error); }
		reader.readAsText(file);
	}.bind(this);

	this.input.click();
	return promise;
}
MM.Backend.Firebase = Object.create(MM.Backend, {
	label: {value: "Firebase"},
	id: {value: "firebase"},
	ref: {value:null, writable:true},
	_current: {value: {
		id: null,
		name: null,
		data: null
	}}
});

MM.Backend.Firebase.connect = function(server, auth) {
	// Initialize Firebase
	var config = {
		apiKey: "AIzaSyBO_6uCK8pHjoz1c9htVwZi6Skpm8o4LtQ",
		authDomain: "my-mind.firebaseapp.com",
		databaseURL: "https://" + server + ".firebaseio.com",
		projectId: "firebase-my-mind",
		storageBucket: "firebase-my-mind.appspot.com",
		messagingSenderId: "666556281676"
	};
	firebase.initializeApp(config);

	this.ref = firebase.database().ref();
	
	this.ref.child("names").on("value", function(snap) {
		MM.publish("firebase-list", this, snap.val() || {});
	}, this);

	if (auth) {
		return this._login(auth);
	} else {
		return new Promise().fulfill();
	}
}

MM.Backend.Firebase.save = function(data, id, name) {
	var promise = new Promise();

	try {
		this.ref.child("names/" + id).set(name);
		this.ref.child("data/" + id).set(data, function(result) {
			if (result) {
				promise.reject(result);
			} else {
				promise.fulfill();
				this._listenStart(data, id);
			}
		}.bind(this));
	} catch (e) {
		promise.reject(e);
	}
	return promise;
}

MM.Backend.Firebase.load = function(id) {
	var promise = new Promise();
	
	this.ref.child("data/" + id).once("value", function(snap) {
		var data = snap.val();
		if (data) {
			promise.fulfill(data);
			this._listenStart(data, id);
		} else {
			promise.reject(new Error("There is no such saved map"));
		}
	}, this);
	return promise;
}

MM.Backend.Firebase.remove = function(id) {
	var promise = new Promise();

	try {
		this.ref.child("names/" + id).remove();
		this.ref.child("data/" + id).remove(function(result) {
			if (result) {
				promise.reject(result);
			} else {
				promise.fulfill();
			}
		});
	} catch (e) {
		promise.reject(e);
	}

	return promise;
}

MM.Backend.Firebase.reset = function() {
	this._listenStop(); /* do not monitor current firebase ref for changes */
}

/**
 * Merge current (remote) data with updated map
 */
MM.Backend.Firebase.mergeWith = function(data, name) {
	var id = this._current.id;

	if (name != this._current.name) {
		this._current.name = name;
		this.ref.child("names/" + id).set(name);
	}


	var dataRef = this.ref.child("data/" + id);
	var oldData = this._current.data;

	this._listenStop();
	this._recursiveRefMerge(dataRef, oldData, data);
	this._listenStart(data, id);
}

/**
 * @param {Firebase} ref
 * @param {object} oldData
 * @param {object} newData
 */
MM.Backend.Firebase._recursiveRefMerge = function(ref, oldData, newData) {
	var updateObject = {};

	if (newData instanceof Array) { /* merge arrays */

		for (var i=0; i<newData.length; i++) {
			var newValue = newData[i];

			if (!(i in oldData)) { /* new key */
				updateObject[i] = newValue;
			} else if (typeof(newValue) == "object") { /* recurse */
				this._recursiveRefMerge(ref.child(i), oldData[i], newValue);
			} else if (newValue !== oldData[i]) { /* changed key */
				updateObject[i] = newValue;
			}
		}

		for (var i=newData.length; i<oldData.length; i++) { updateObject[i] = null; } /* removed array items */

	} else { /* merge objects */

		for (var p in newData) { /* new/changed keys */
			var newValue = newData[p];

			if (!(p in oldData)) { /* new key */
				updateObject[p] = newValue;
			} else if (typeof(newValue) == "object") { /* recurse */
				this._recursiveRefMerge(ref.child(p), oldData[p], newValue);
			} else if (newValue !== oldData[p]) { /* changed key */
				updateObject[p] = newValue;
			}

		}

		for (var p in oldData) { /* removed keys */
			if (!(p in newData)) { updateObject[p] = null; }
		}

	}

	if (Object.keys(updateObject).length) { ref.update(updateObject); }
}

MM.Backend.Firebase._listenStart = function(data, id) {
	if (this._current.id && this._current.id == id) { return; }

	this._listenStop();
	this._current.id = id;
	this._current.data = data;

	this.ref.child("data/" + id).on("value", this._valueChange, this);
}

MM.Backend.Firebase._listenStop = function() {
	if (!this._current.id) { return; }

	this.ref.child("data/" + this._current.id).off("value");
	this._current.id = null;
	this._current.name = null;
	this._current.data = null;
}


/**
 * Monitored remote ref changed.
 * FIXME move timeout logic to ui.backend.firebase?
 */
MM.Backend.Firebase._valueChange = function(snap) {
	this._current.data = snap.val();
	if (this._changeTimeout) { clearTimeout(this._changeTimeout); }
	this._changeTimeout = setTimeout(function() {
		MM.publish("firebase-change", this, this._current.data);
	}.bind(this), 200);
}

MM.Backend.Firebase._login = function(type) {
	var provider;
	switch (type) {
		case "github":
			provider = new firebase.auth.GithubAuthProvider();
		break;
		case "facebook":
			provider = new firebase.auth.FacebookAuthProvider();
		break;
		case "twitter":
			provider = new firebase.auth.TwitterAuthProvider();
		break;
		case "google":
			provider = new firebase.auth.GoogleAuthProvider();
		break;
	}

	return firebase.auth().signInWithPopup(provider).then(function(result) {
		return result.user;
	});
}
MM.Backend.GDrive = Object.create(MM.Backend, {
	id: {value: "gdrive"},
	label: {value: "Google Drive"},
	scope: {value: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.install"},
	clientId: {value: "767837575056-h87qmlhmhb3djhaaqta5gv2v3koa9hii.apps.googleusercontent.com"},
	apiKey: {value: "AIzaSyCzu1qVxlgufneOYpBgDJXN6Z9SNVcHYWM"},
	fileId: {value: null, writable: true}
});

MM.Backend.GDrive.reset = function() {
	this.fileId = null;
}

MM.Backend.GDrive.save = function(data, name, mime) {
	return this._connect().then(
		function() {
			return this._send(data, name, mime);
		}.bind(this)
	);
}

MM.Backend.GDrive._send = function(data, name, mime) {
	var promise = new Promise();

	var path = "/upload/drive/v2/files";
	var method = "POST";
	if (this.fileId) {
		path += "/" + this.fileId;
		method = "PUT";
	}

	var boundary = "b" + Math.random();
	var delimiter = "--" + boundary;
	var body = [
		delimiter,
		"Content-Type: application/json", "",
		JSON.stringify({title:name}),
		delimiter,
		"Content-Type: " + mime, "",
		data,
		delimiter + "--"
	].join("\r\n");

	var request = gapi.client.request({
		path: path,
		method: method,
		headers: {
			"Content-Type": "multipart/mixed; boundary='" + boundary + "'"
		},
		body: body
	});

	request.execute(function(response) {
		if (!response) {
			promise.reject(new Error("Failed to upload to Google Drive"));
		} else if (response.error) {
			promise.reject(response.error);
		} else {
			this.fileId = response.id;
			promise.fulfill();
		}
	}.bind(this));
	
	return promise;
}

MM.Backend.GDrive.load = function(id) {
	return this._connect().then(
		this._load.bind(this, id)
	);
}

MM.Backend.GDrive._load = function(id) {
	this.fileId = id;

	var promise = new Promise();

	var request = gapi.client.request({
		path: "/drive/v2/files/" + this.fileId,
		method: "GET"
	});

	request.execute(function(response) {
		if (response && response.downloadUrl) {
			var xhr = new XMLHttpRequest();
			xhr.open("get", response.downloadUrl, true);
			xhr.setRequestHeader("Authorization", "Bearer " + gapi.auth.getToken().access_token);
			Promise.send(xhr).then(
				function(xhr) { promise.fulfill({data:xhr.responseText, name:response.title, mime:response.mimeType}); },
				function(xhr) { promise.reject(xhr.responseText); }
			);
		} else {
			promise.reject(response && response.error || new Error("Failed to download file"));
		}
	}.bind(this));

	return promise;
}

MM.Backend.GDrive.pick = function() {
	return this._connect().then(
		this._pick.bind(this)
	);
}

MM.Backend.GDrive._pick = function() {
	var promise = new Promise();

	var token = gapi.auth.getToken();
	var formats = MM.Format.getAll();
	var mimeTypes = ["application/json; charset=UTF-8", "application/json"];
	formats.forEach(function(format) {
		if (format.mime) { mimeTypes.unshift(format.mime); }
	});

	var view = new google.picker.DocsView(google.picker.ViewId.DOCS)
		.setMimeTypes(mimeTypes.join(","))
		.setMode(google.picker.DocsViewMode.LIST);

	var picker = new google.picker.PickerBuilder()
		.enableFeature(google.picker.Feature.NAV_HIDDEN)
		.addView(view)
		.setOAuthToken(token.access_token)
		.setDeveloperKey(this.apiKey)
		.setCallback(function(data) {
			switch (data[google.picker.Response.ACTION]) {
				case google.picker.Action.PICKED:
			 		var doc = data[google.picker.Response.DOCUMENTS][0];
			 		promise.fulfill(doc.id);
				break;

				case google.picker.Action.CANCEL:
					promise.fulfill(null);
				break;
			}
		})
		.build();
	picker.setVisible(true);

	return promise;
}

MM.Backend.GDrive._connect = function() {
	if (window.gapi && window.gapi.auth.getToken()) {
		return new Promise().fulfill();
	} else {
		return this._loadGapi().then(this._auth.bind(this));
	}
}

MM.Backend.GDrive._loadGapi = function() {
	var promise = new Promise();
	if (window.gapi) { return promise.fulfill(); }
	
	var script = document.createElement("script");
	var name = ("cb"+Math.random()).replace(".", "");
	window[name] = promise.fulfill.bind(promise);
	script.src = "https://apis.google.com/js/client:picker.js?onload=" + name;
	document.body.appendChild(script);

	return promise;
}

MM.Backend.GDrive._auth = function(forceUI) {
	var promise = new Promise();

	gapi.auth.authorize({
		"client_id": this.clientId,
		"scope": this.scope,
		"immediate": !forceUI
	}, function(token) {
		if (token && !token.error) { /* done */
			promise.fulfill();
		} else if (!forceUI) { /* try again with ui */
			this._auth(true).then(
				promise.fulfill.bind(promise),
				promise.reject.bind(promise)
			);
		} else { /* bad luck */
			promise.reject(token && token.error || new Error("Failed to authorize with Google"));
		}
	}.bind(this));

	return promise;
}
MM.UI = function() {
	this._node = document.querySelector(".ui");
	
	this._toggle = this._node.querySelector("#toggle");

	this._layout = new MM.UI.Layout();
	this._shape = new MM.UI.Shape();
	this._icon = new MM.UI.Icon();
	this._color = new MM.UI.Color();
	this._value = new MM.UI.Value();
	this._status = new MM.UI.Status();
		
	MM.subscribe("item-select", this);
	MM.subscribe("item-change", this);

	this._node.addEventListener("click", this);
	this._node.addEventListener("change", this);

	this.toggle();
}

MM.UI.prototype.handleMessage = function(message, publisher) {
	switch (message) {
		case "item-select":
			this._update();
		break;

		case "item-change":
			if (publisher == MM.App.current) { this._update(); }
		break;
	}
}

MM.UI.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "click":
			if (e.target.nodeName.toLowerCase() != "select") { MM.Clipboard.focus(); } /* focus the clipboard (2c) */

			if (e.target == this._toggle) {
				this.toggle();
				return;
			}
			
			var node = e.target;
			while (node != document) {
				var command = node.getAttribute("data-command");
				if (command) {
					MM.Command[command].execute();
					return;
				}
				node = node.parentNode;
			}
		break;

		case "change":
			MM.Clipboard.focus(); /* focus the clipboard (2c) */
		break;
	}
}

MM.UI.prototype.toggle = function() {
	this._node.classList.toggle("visible");
	MM.publish("ui-change", this);
}


MM.UI.prototype.getWidth = function() {
	return (this._node.classList.contains("visible") ? this._node.offsetWidth : 0);
}

MM.UI.prototype._update = function() {
	this._layout.update();
	this._shape.update();
	this._icon.update();
	this._value.update();
	this._status.update();
}
MM.UI.Layout = function() {
	this._select = document.querySelector("#layout");

	this._select.appendChild(MM.Layout.Map.buildOption());

	var label = this._buildGroup("Graph");
	label.appendChild(MM.Layout.Graph.Right.buildOption());
	label.appendChild(MM.Layout.Graph.Left.buildOption());
	label.appendChild(MM.Layout.Graph.Down.buildOption());
	label.appendChild(MM.Layout.Graph.Up.buildOption());

	var label = this._buildGroup("Tree");
	label.appendChild(MM.Layout.Tree.Right.buildOption());
	label.appendChild(MM.Layout.Tree.Left.buildOption());
	
	this._select.addEventListener("change", this);
}

MM.UI.Layout.prototype.update = function() {
	var value = "";
	var layout = MM.App.current.getOwnLayout();
	if (layout) { value = layout.id; }
	this._select.value = value;
	
	this._getOption("").disabled = MM.App.current.isRoot();
	this._getOption(MM.Layout.Map.id).disabled = !MM.App.current.isRoot();
}

MM.UI.Layout.prototype.handleEvent = function(e) {
	var layout = MM.Layout.getById(this._select.value);

	var action = new MM.Action.SetLayout(MM.App.current, layout);
	MM.App.action(action);
}

MM.UI.Layout.prototype._getOption = function(value) {
	return this._select.querySelector("option[value='" + value + "']");
}

MM.UI.Layout.prototype._buildGroup = function(label) {
	var node = document.createElement("optgroup");
	node.label = label;
	this._select.appendChild(node);
	return node;
}
MM.UI.Shape = function() {
	this._select = document.querySelector("#shape");
	
	this._select.appendChild(MM.Shape.Box.buildOption());
	this._select.appendChild(MM.Shape.Ellipse.buildOption());
	this._select.appendChild(MM.Shape.Underline.buildOption());
	
	this._select.addEventListener("change", this);
}

MM.UI.Shape.prototype.update = function() {
	var value = "";
	var shape = MM.App.current.getOwnShape();
	if (shape) { value = shape.id; }

	this._select.value = value;
}

MM.UI.Shape.prototype.handleEvent = function(e) {
	var shape = MM.Shape.getById(this._select.value);

	var action = new MM.Action.SetShape(MM.App.current, shape);
	MM.App.action(action);
}
MM.UI.Value = function() {
	this._select = document.querySelector("#value");
	this._select.addEventListener("change", this);
}

MM.UI.Value.prototype.update = function() {
	var value = MM.App.current.getValue();
	if (value === null) { value = ""; }
	if (typeof(value) == "number") { value = "num" }

	this._select.value = value;
}

MM.UI.Value.prototype.handleEvent = function(e) {
	var value = this._select.value;
	if (value == "num") {
		MM.Command.Value.execute();
	} else {
		var action = new MM.Action.SetValue(MM.App.current, value || null);
		MM.App.action(action);
	}
}
MM.UI.Status = function() {
	this._select = document.querySelector("#status");
	this._select.addEventListener("change", this);
}

MM.UI.Status.prototype.update = function() {
	this._select.value = MM.App.current.getStatus() || "";
}

MM.UI.Status.prototype.handleEvent = function(e) {
	var action = new MM.Action.SetStatus(MM.App.current, this._select.value || null);
	MM.App.action(action);
}
MM.UI.Color = function() {
	this._node = document.querySelector("#color");
	this._node.addEventListener("click", this);

	var items = this._node.querySelectorAll("[data-color]");
	
	for (var i=0;i<items.length;i++) {
		var item = items[i];
		item.style.backgroundColor = item.getAttribute("data-color");
	}
}

MM.UI.Color.prototype.handleEvent = function(e) {
	e.preventDefault();
	if (!e.target.hasAttribute("data-color")) { return; }
	
	var color = e.target.getAttribute("data-color") || null;
	var action = new MM.Action.SetColor(MM.App.current, color);
	MM.App.action(action);
}
MM.UI.Icon = function() {
    this._select = document.querySelector("#icons");
    this._select.addEventListener("change", this);
}

MM.UI.Icon.prototype.update = function() {
    this._select.value = MM.App.current.getIcon() || "";
}

MM.UI.Icon.prototype.handleEvent = function(e) {
    var action = new MM.Action.SetIcon(MM.App.current, this._select.value || null);
    MM.App.action(action);
}
MM.UI.Help = function() {
	this._node = document.querySelector("#help");
	this._map = {
		8: "Backspace",
		9: "Tab",
		13: "↩",
		32: "Spacebar",
		33: "PgUp",
		34: "PgDown",
		35: "End",
		36: "Home",
		37: "←",
		38: "↑",
		39: "→",
		40: "↓",
		45: "Insert",
		46: "Delete",
		65: "A",
		68: "D",
		83: "S",
		87: "W",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		"-": "&minus;"
	};
	
	this._build();
}

MM.UI.Help.prototype.toggle = function() {
	this._node.classList.toggle("visible");
}

MM.UI.Help.prototype._build = function() {
	var t = this._node.querySelector(".navigation");
	this._buildRow(t, "Pan");
	this._buildRow(t, "Select");
	this._buildRow(t, "SelectRoot");
	this._buildRow(t, "SelectParent");
	this._buildRow(t, "Center");
	this._buildRow(t, "ZoomIn", "ZoomOut");
	this._buildRow(t, "Fold");

	var t = this._node.querySelector(".manipulation");
	this._buildRow(t, "InsertSibling");
	this._buildRow(t, "InsertChild");
	this._buildRow(t, "Swap");
	this._buildRow(t, "Side");
	this._buildRow(t, "Delete");

	this._buildRow(t, "Copy");
	this._buildRow(t, "Cut");
	this._buildRow(t, "Paste");

	var t = this._node.querySelector(".editing");
	this._buildRow(t, "Value");
	this._buildRow(t, "Yes", "No", "Computed");
	this._buildRow(t, "Edit");
	this._buildRow(t, "Newline");
	this._buildRow(t, "Bold");
	this._buildRow(t, "Italic");
	this._buildRow(t, "Underline");
	this._buildRow(t, "Strikethrough");

	var t = this._node.querySelector(".other");
	this._buildRow(t, "Undo", "Redo");
	this._buildRow(t, "Save");
	this._buildRow(t, "SaveAs");
	this._buildRow(t, "Load");
	this._buildRow(t, "Help");
	this._buildRow(t, "UI");
}

MM.UI.Help.prototype._buildRow = function(table, commandName) {
	var row = table.insertRow(-1);

	var labels = [];
	var keys = [];

	for (var i=1;i<arguments.length;i++) {
		var command = MM.Command[arguments[i]];
		labels.push(command.label);
		keys = keys.concat(command.keys.map(this._formatKey, this));
	}

	row.insertCell(-1).innerHTML = labels.join("/");
	row.insertCell(-1).innerHTML = keys.join("/");

}

MM.UI.Help.prototype._formatKey = function(key) {
	var str = "";
	if (key.ctrlKey) { str += "Ctrl+"; }
	if (key.altKey) { str += "Alt+"; }
	if (key.shiftKey) { str += "Shift+"; }
	if (key.charCode) { 
		var ch = String.fromCharCode(key.charCode);
		str += this._map[ch] || ch.toUpperCase(); 
	}
	if (key.keyCode) { str += this._map[key.keyCode] || String.fromCharCode(key.keyCode); }
	return str;
}
MM.UI.IO = function() {
	this._prefix = "mm.app.";
	this._mode = "";
	this._node = document.querySelector("#io");
	this._heading = this._node.querySelector("h3");

	this._backend = this._node.querySelector("#backend");
	this._currentBackend = null;
	this._backends = {};
	var ids = ["local", "firebase", "gdrive", "file", "webdav", "image"];
	ids.forEach(function(id) {
		var ui = MM.UI.Backend.getById(id);
		ui.init(this._backend);
		this._backends[id] = ui;
	}, this);

	this._backend.value = localStorage.getItem(this._prefix + "backend") || MM.Backend.File.id;
	this._backend.addEventListener("change", this);
	
	MM.subscribe("map-new", this);
	MM.subscribe("save-done", this);
	MM.subscribe("load-done", this);
}

MM.UI.IO.prototype.restore = function() {
	var parts = {};
	location.search.substring(1).split("&").forEach(function(item) {
		var keyvalue = item.split("=");
		parts[decodeURIComponent(keyvalue[0])] = decodeURIComponent(keyvalue[1]);
	});
	
	/* backwards compatibility */
	if ("map" in parts) { parts.url = parts.map; }

	/* just URL means webdav backend */
	if ("url" in parts && !("b" in parts)) { parts.b = "webdav"; }

	var backend = MM.UI.Backend.getById(parts.b);
	if (backend) { /* saved backend info */
		backend.setState(parts); 
		return;
	}

	if (parts.state) { /* opened from gdrive */
		try {
			var state = JSON.parse(parts.state);
			if (state.action == "open") {
				state = {
					b: "gdrive",
					id: state.ids[0]
				};
				MM.UI.Backend.GDrive.setState(state);
			} else {
				history.replaceState(null, "", ".");
			}
			return;
		} catch (e) { }
	}
}

MM.UI.IO.prototype.handleMessage = function(message, publisher) {
	switch (message) {
		case "map-new":
			this._setCurrentBackend(null);
		break;
		
		case "save-done":
		case "load-done":
			this.hide();
			this._setCurrentBackend(publisher);
		break;
	}
}

MM.UI.IO.prototype.show = function(mode) {
	this._mode = mode;
	this._node.classList.add("visible");
	this._heading.innerHTML = mode;
	
	this._syncBackend();
	window.addEventListener("keydown", this);
}

MM.UI.IO.prototype.hide = function() {
	if (!this._node.classList.contains("visible")) { return; }
	this._node.classList.remove("visible");
	MM.Clipboard.focus();
	window.removeEventListener("keydown", this);
}

MM.UI.IO.prototype.quickSave = function() {
	if (this._currentBackend) { 
		this._currentBackend.save();
	} else {
		this.show("save");
	}
}

MM.UI.IO.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "keydown":
			if (e.keyCode == 27) { this.hide(); }
		break;
		
		case "change":
			this._syncBackend();
		break;
	}
}

MM.UI.IO.prototype._syncBackend = function() {
	var all = this._node.querySelectorAll("div[id]");
	[].slice.apply(all).forEach(function(node) { node.style.display = "none"; });
	
	this._node.querySelector("#" + this._backend.value).style.display = "";
	
	this._backends[this._backend.value].show(this._mode);
}

/**
 * @param {MM.UI.Backend} backend
 */
MM.UI.IO.prototype._setCurrentBackend = function(backend) {
	if (this._currentBackend && this._currentBackend != backend) { this._currentBackend.reset(); }
	
	if (backend) { localStorage.setItem(this._prefix + "backend", backend.id); }
	this._currentBackend = backend;
	try {
		this._updateURL(); /* fails when on file:/// */
	} catch (e) {}
}

MM.UI.IO.prototype._updateURL = function() {
	var data = this._currentBackend && this._currentBackend.getState();
	if (!data) {
		history.replaceState(null, "", ".");
	} else {
		var arr = Object.keys(data).map(function(key) {
			return encodeURIComponent(key)+"="+encodeURIComponent(data[key]);
		});
		history.replaceState(null, "", "?" + arr.join("&"));
	}
}
MM.UI.Backend = Object.create(MM.Repo);

MM.UI.Backend.init = function(select) {
	this._backend = MM.Backend.getById(this.id);
	this._mode = "";
	this._prefix = "mm.app." + this.id + ".";

	this._node = document.querySelector("#" + this.id);
	
	this._cancel = this._node.querySelector(".cancel");
	this._cancel.addEventListener("click", this);

	this._go = this._node.querySelector(".go");
	this._go.addEventListener("click", this);
	
	select.appendChild(this._backend.buildOption());
}

MM.UI.Backend.reset = function() {
	this._backend.reset();
}

MM.UI.Backend.setState = function(data) {
}

MM.UI.Backend.getState = function() {
	return null;
}

MM.UI.Backend.handleEvent = function(e) {
	switch (e.target) {
		case this._cancel:
			MM.App.io.hide();
		break;

		case this._go:
			this._action();
		break;
	}
}

MM.UI.Backend.save = function() {
}

MM.UI.Backend.load = function() {
}

MM.UI.Backend.show = function(mode) {
	this._mode = mode;

	this._go.innerHTML = mode.charAt(0).toUpperCase() + mode.substring(1);

	var all = this._node.querySelectorAll("[data-for]");
	[].concat.apply([], all).forEach(function(node) { node.style.display = "none"; });

	var visible = this._node.querySelectorAll("[data-for~=" + mode + "]");
	[].concat.apply([], visible).forEach(function(node) { node.style.display = ""; });

	/* switch to 2a: steal focus from the current item */
	this._go.focus();
}

MM.UI.Backend._action = function() {
	switch (this._mode) {
		case "save":
			this.save();
		break;
		
		case "load":
			this.load();
		break;
	}
}

MM.UI.Backend._saveDone = function() {
	MM.App.setThrobber(false);
	MM.publish("save-done", this);
}

MM.UI.Backend._loadDone = function(json) {
	MM.App.setThrobber(false);
	try {
		MM.App.setMap(MM.Map.fromJSON(json));
		MM.publish("load-done", this);
	} catch (e) { 
		this._error(e);
	}
}

MM.UI.Backend._error = function(e) {
	MM.App.setThrobber(false);
	alert("IO error: " + e.message);
}

MM.UI.Backend._buildList = function(list, select) {
	var data = [];
	
	for (var id in list) {
		data.push({id:id, name:list[id]});
	}
	
	data.sort(function(a, b) {
		return a.name.localeCompare(b.name);
	});
	
	data.forEach(function(item) {
		var o = document.createElement("option");
		o.value = item.id;
		o.innerHTML = item.name;
		select.appendChild(o);
	});
}
MM.UI.Backend.File = Object.create(MM.UI.Backend, {
	id: {value: "file"}
});

MM.UI.Backend.File.init = function(select) {
	MM.UI.Backend.init.call(this, select);

	this._format = this._node.querySelector(".format");
	this._format.appendChild(MM.Format.JSON.buildOption());
	this._format.appendChild(MM.Format.FreeMind.buildOption());
	this._format.appendChild(MM.Format.MMA.buildOption());
	this._format.appendChild(MM.Format.Mup.buildOption());
	this._format.appendChild(MM.Format.Plaintext.buildOption());
	this._format.value = localStorage.getItem(this._prefix + "format") || MM.Format.JSON.id;
}

MM.UI.Backend.File.show = function(mode) {
	MM.UI.Backend.show.call(this, mode);
	
	this._go.innerHTML = (mode == "save" ? "Save" : "Browse");
}

MM.UI.Backend.File._action = function() {
	localStorage.setItem(this._prefix + "format", this._format.value);
	
	MM.UI.Backend._action.call(this);
}

MM.UI.Backend.File.save = function() {
	var format = MM.Format.getById(this._format.value);
	var json = MM.App.map.toJSON();
	var data = format.to(json);

	var name = MM.App.map.getName() + "." + format.extension;
	this._backend.save(data, name).then(
		this._saveDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.File.load = function() {
	this._backend.load().then(
		this._loadDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.File._loadDone = function(data) {
	try {
		var format = MM.Format.getByName(data.name) || MM.Format.JSON;
		var json = format.from(data.data);
	} catch (e) { 
		this._error(e);
	}

	MM.UI.Backend._loadDone.call(this, json);
}
MM.UI.Backend.WebDAV = Object.create(MM.UI.Backend, {
	id: {value: "webdav"}
});

MM.UI.Backend.WebDAV.init = function(select) {
	MM.UI.Backend.init.call(this, select);

	this._url = this._node.querySelector(".url");
	this._url.value = localStorage.getItem(this._prefix + "url") || "";
	
	this._current = "";
}

MM.UI.Backend.WebDAV.getState = function() {
	var data = {
		url: this._current
	};
	return data;
}

MM.UI.Backend.WebDAV.setState = function(data) {
	this._load(data.url);
}

MM.UI.Backend.WebDAV.save = function() {
	MM.App.setThrobber(true);

	var map = MM.App.map;
	var url = this._url.value;
	localStorage.setItem(this._prefix + "url", url);

	if (url.match(/\.mymind$/)) { /* complete file name */
	} else { /* just a path */
		if (url.charAt(url.length-1) != "/") { url += "/"; }
		url += map.getName() + "." + MM.Format.JSON.extension;
	}

	this._current = url;
	var json = map.toJSON();
	var data = MM.Format.JSON.to(json);

	this._backend.save(data, url).then(
		this._saveDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.WebDAV.load = function() {
	this._load(this._url.value);
}

MM.UI.Backend.WebDAV._load = function(url) {
	this._current = url;
	MM.App.setThrobber(true);

	var lastIndex = url.lastIndexOf("/");
	this._url.value = url.substring(0, lastIndex);
	localStorage.setItem(this._prefix + "url", this._url.value);

	this._backend.load(url).then(
		this._loadDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.WebDAV._loadDone = function(data) {
	try {
		var json = MM.Format.JSON.from(data);
	} catch (e) { 
		this._error(e);
	}

	MM.UI.Backend._loadDone.call(this, json);
}
MM.UI.Backend.Image = Object.create(MM.UI.Backend, {
	id: {value: "image"}
});

MM.UI.Backend.Image.save = function() {
	var name = MM.App.map.getName();
	var json = MM.App.map.toJSON();
	var data = MM.Format.JSON.to(json);

	this._backend.save(data, name);
}

MM.UI.Backend.Image.load = null;
MM.UI.Backend.Local = Object.create(MM.UI.Backend, {
	id: {value: "local"}
});

MM.UI.Backend.Local.init = function(select) {
	MM.UI.Backend.init.call(this, select);
	
	this._list = this._node.querySelector(".list");
	this._remove = this._node.querySelector(".remove");
	this._remove.addEventListener("click", this);
}

MM.UI.Backend.Local.handleEvent = function(e) {
	MM.UI.Backend.handleEvent.call(this, e);

	switch (e.target) {
		case this._remove:
			var id = this._list.value;
			if (!id) { break; } 
			this._backend.remove(id);
			this.show(this._mode);
		break;
	}
}

MM.UI.Backend.Local.show = function(mode) {
	MM.UI.Backend.show.call(this, mode);
	
	this._go.disabled = false;

	if (mode == "load") { 
		var list = this._backend.list();
		this._list.innerHTML = "";
		if (Object.keys(list).length) {
			this._go.disabled = false;
			this._remove.disabled = false;
			this._buildList(list, this._list);
		} else {
			this._go.disabled = true;
			this._remove.disabled = true;
			var o = document.createElement("option");
			o.innerHTML = "(no maps saved)";
			this._list.appendChild(o);
		}
	}
}

MM.UI.Backend.Local.setState = function(data) {
	this._load(data.id);
}

MM.UI.Backend.Local.getState = function() {
	var data = {
		b: this.id,
		id: MM.App.map.getId()
	};
	return data;
}

MM.UI.Backend.Local.save = function() {
	var json = MM.App.map.toJSON();
	var data = MM.Format.JSON.to(json);

	try {
		this._backend.save(data, MM.App.map.getId(), MM.App.map.getName());
		this._saveDone();
	} catch (e) {
		this._error(e);
	}
}

MM.UI.Backend.Local.load = function() {
	this._load(this._list.value);
}

MM.UI.Backend.Local._load = function(id) {
	try {
		var data = this._backend.load(id);
		var json = MM.Format.JSON.from(data);
		this._loadDone(json);
	} catch (e) {
		this._error(e);
	}
}
MM.UI.Backend.Firebase = Object.create(MM.UI.Backend, {
	id: {value: "firebase"}
});

MM.UI.Backend.Firebase.init = function(select) {
	MM.UI.Backend.init.call(this, select);
	
	this._online = false;
	this._itemChangeTimeout = null;
	this._list = this._node.querySelector(".list");
	this._server = this._node.querySelector(".server");
	this._server.value = localStorage.getItem(this._prefix + "server") || "my-mind";

	this._auth = this._node.querySelector(".auth");
	this._auth.value = localStorage.getItem(this._prefix + "auth") || "";

	this._remove = this._node.querySelector(".remove");
	this._remove.addEventListener("click", this);

	this._go.disabled = false;
	MM.subscribe("firebase-list", this);
	MM.subscribe("firebase-change", this);
}

MM.UI.Backend.Firebase.setState = function(data) {
	this._connect(data.s, data.a).then(
		this._load.bind(this, data.id),
		this._error.bind(this)
	);
}

MM.UI.Backend.Firebase.getState = function() {
	var data = {
		id: MM.App.map.getId(),
		b: this.id,
		s: this._server.value
	};
	if (this._auth.value) { data.a = this._auth.value; }
	return data;
}

MM.UI.Backend.Firebase.show = function(mode) {
	MM.UI.Backend.show.call(this, mode);
	this._sync();
}

MM.UI.Backend.Firebase.handleEvent = function(e) {
	MM.UI.Backend.handleEvent.call(this, e);

	switch (e.target) {
		case this._remove:
			var id = this._list.value;
			if (!id) { break; }
			MM.App.setThrobber(true);
			this._backend.remove(id).then(
				function() { MM.App.setThrobber(false); },
				this._error.bind(this)
			);
		break;
	}
}

MM.UI.Backend.Firebase.handleMessage = function(message, publisher, data) {
	switch (message) {
		case "firebase-list":
			this._list.innerHTML = "";
			if (Object.keys(data).length) {
				this._buildList(data, this._list);
			} else {
				var o = document.createElement("option");
				o.innerHTML = "(no maps saved)";
				this._list.appendChild(o);
			}
			this._sync();
		break;

		case "firebase-change":
			if (data) {
				MM.unsubscribe("item-change", this);
				MM.App.map.mergeWith(data);
				MM.subscribe("item-change", this);
			} else { /* FIXME */
				console.log("remote data disappeared");
			}
		break;

		case "item-change":
			if (this._itemChangeTimeout) { clearTimeout(this._itemChangeTimeout); }
			this._itemChangeTimeout = setTimeout(this._itemChange.bind(this), 200);
		break;
	}
}

MM.UI.Backend.Firebase.reset = function() {
	this._backend.reset();
	MM.unsubscribe("item-change", this);
}

MM.UI.Backend.Firebase._itemChange = function() {
	var map = MM.App.map;
	this._backend.mergeWith(map.toJSON(), map.getName());
}

MM.UI.Backend.Firebase._action = function() {
	if (!this._online) {
		this._connect(this._server.value, this._auth.value);
		return;
	}
	
	MM.UI.Backend._action.call(this);
}

MM.UI.Backend.Firebase.save = function() {
	MM.App.setThrobber(true);

	var map = MM.App.map;
	this._backend.save(map.toJSON(), map.getId(), map.getName()).then(
		this._saveDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.Firebase.load = function() {
	this._load(this._list.value);
}

MM.UI.Backend.Firebase._load = function(id) {
	MM.App.setThrobber(true);
	/* FIXME posere se kdyz zmenim jeden firebase na jiny, mozna */
	this._backend.load(id).then(
		this._loadDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.Firebase._connect = function(server, auth) {
	var promise = new Promise();

	this._server.value = server;
	this._auth.value = auth;
	this._server.disabled = true;
	this._auth.disabled = true;

	localStorage.setItem(this._prefix + "server", server);
	localStorage.setItem(this._prefix + "auth", auth || "");

	this._go.disabled = true;
	MM.App.setThrobber(true);

	this._backend.connect(server, auth).then(
		function() {
			this._connected();
			promise.fulfill();
		}.bind(this),
		promise.reject.bind(promise)
	);

	return promise;
}

MM.UI.Backend.Firebase._connected = function() {
	MM.App.setThrobber(false);
	this._online = true;
	this._sync();
}

MM.UI.Backend.Firebase._sync = function() {
	if (!this._online) {
		this._go.innerHTML = "Connect";
		return;
	}

	this._go.disabled = false;
	if (this._mode == "load" && !this._list.value) { this._go.disabled = true; }
	this._go.innerHTML = this._mode.charAt(0).toUpperCase() + this._mode.substring(1);
}

MM.UI.Backend.Firebase._loadDone = function() {
	MM.subscribe("item-change", this);
	MM.UI.Backend._loadDone.apply(this, arguments);
}

MM.UI.Backend.Firebase._saveDone = function() {
	MM.subscribe("item-change", this);
	MM.UI.Backend._saveDone.apply(this, arguments);
}
MM.UI.Backend.GDrive = Object.create(MM.UI.Backend, {
	id: {value: "gdrive"}
});

MM.UI.Backend.GDrive.init = function(select) {
	MM.UI.Backend.init.call(this, select);

	this._format = this._node.querySelector(".format");
	this._format.appendChild(MM.Format.JSON.buildOption());
	this._format.appendChild(MM.Format.FreeMind.buildOption());
	this._format.appendChild(MM.Format.MMA.buildOption());
	this._format.appendChild(MM.Format.Mup.buildOption());
	this._format.appendChild(MM.Format.Plaintext.buildOption());
	this._format.value = localStorage.getItem(this._prefix + "format") || MM.Format.JSON.id;
}

MM.UI.Backend.GDrive.save = function() {
	MM.App.setThrobber(true);

	var format = MM.Format.getById(this._format.value);
	var json = MM.App.map.toJSON();
	var data = format.to(json);
	var name = MM.App.map.getName();
	var mime = "text/plain";
	
	if (format.mime) {
		mime = format.mime;
	} else {
		name += "." + format.extension;
	}

	this._backend.save(data, name, mime).then(
		this._saveDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.GDrive.load = function() {
	MM.App.setThrobber(true);

	this._backend.pick().then(
		this._picked.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.GDrive._picked = function(id) {
	MM.App.setThrobber(false);
	if (!id) { return;  }

	MM.App.setThrobber(true);

	this._backend.load(id).then(
		this._loadDone.bind(this),
		this._error.bind(this)
	)
}

MM.UI.Backend.GDrive.setState = function(data) {
	this._picked(data.id);
}

MM.UI.Backend.GDrive.getState = function() {
	var data = {
		b: this.id,
		id: this._backend.fileId
	};
	return data;
}

MM.UI.Backend.GDrive._loadDone = function(data) {
	try {
		var format = MM.Format.getByMime(data.mime) || MM.Format.getByName(data.name) || MM.Format.JSON;
		var json = format.from(data.data);
	} catch (e) { 
		this._error(e);
	}

	MM.UI.Backend._loadDone.call(this, json);
}
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
