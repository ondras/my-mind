import * as html from "./html.js";
import * as svg from "./svg.js";
import * as pubsub from "./pubsub.js";

declare global {
	interface Window {
		editor: any;
	}
}


const COLOR = "#999";

/* RE explanation:
 *            _________________________________________________________________________ One of the three possible variants
 *             ____________________ scheme://x
 *                                  ___________________________ aa.bb.cc
 *                                                              _______________________ aa.bb/
 *                                                                                      ______ path, search
 *                                                                                            __________________________ end with a non-forbidden char
 *                                                                                                                      ______ end of word or end of string
 */
const RE = /\b(([a-z][\w-]+:\/\/\w)|(([\w-]+\.){2,}[a-z][\w-]+)|([\w-]+\.[a-z][\w-]+\/))[^\s]*([^\s,.;:?!<>\(\)\[\]'"])?($|\b)/i;

const UPDATE_OPTIONS = {
	parent: true,
	children: false
}

export default class Item {
	// these have getters/setters
	protected _id = generateId();
	protected _parent: Item | null = null;
	protected _collapsed = false;
	protected _icon: string | null = null;
	protected _notes: string | null = null;

	dom = {
		node: html.node("li"),
		content: html.node("div"),
		notes: html.node("div"),
		status: html.node("span"),
		icon: html.node("span"),
		value: html.node("span"),
		text: html.node("div"),
		children: html.node("ul"),
		toggle: html.node("div"),
		canvas: html.node("canvas")
	}

	readonly children: Item[] = [];

	// todo
	protected _layout = null;
	protected _shape = null;
	protected _autoShape = true;
	protected _color = null;
	protected _value = null;
	protected _status = null;
	protected _side = null; /* side preference */
	protected _oldText = "";
	protected _computed = {
		value: 0,
		status: null
	}

	static fromJSON(data) {
		return new this().fromJSON(data);
	}

	constructor() {
		const { dom } = this;
		dom.node.classList.add("item");
		dom.content.classList.add("content");
		dom.notes.classList.add("notes-indicator");
		dom.status.classList.add("status");
		dom.icon.classList.add("icon");
		dom.value.classList.add("value");
		dom.text.classList.add("text");
		dom.toggle.classList.add("toggle");
		dom.children.classList.add("children");

		dom.node.append(dom.canvas, dom.content);
		dom.content.append(dom.text, dom.notes); /* status+value are appended in layout */
		/* toggle+children are appended when children exist */

		dom.toggle.addEventListener("click", this);
	}

	get id() { return this._id; }

	get parent() { return this._parent; }
	set parent(parent: Item | null) {
		this._parent = parent;
		this.update({children:true});
	}

	// fixme zrusit
	get ctx() { return this.dom.canvas.getContext("2d"); }

	get metrics() { // FIXME bud tohle, nebo size/position
		const { dom } = this, { node } = dom;
		return {
			left: node.offsetLeft,
			top: node.offsetTop,
			width: node.offsetWidth,
			height: node.offsetHeight,
		}
	}

	get size() {
		const { node } = this.dom;
		return [node.offsetWidth, node.offsetHeight];
	}
	set size(size: number[]) {
		const { node, canvas } = this.dom;
		node.style.width = `${size[0]}px`;
		node.style.height = `${size[1]}px`;

		canvas.width = size[0];
		canvas.height = size[1];
	}

	get position() {
		const { node } = this.dom;
		return [node.offsetLeft, node.offsetTop];
	}
	set position(position: number[]) {
		const { node } = this.dom;
		node.style.left = `${position[0]}px`;
		node.style.top = `${position[1]}px`;
	}

	get contentSize() {
		const { content } = this.dom;
		return [content.offsetWidth, content.offsetHeight];
	}

	get contentPosition() {
		const { content } = this.dom;
		return [content.offsetLeft, content.offsetTop];
	}
	set contentPosition(position: number[]) {
		const { content } = this.dom;
		content.style.left = `${position[0]}px`;
		content.style.top = `${position[1]}px`;
	}

	toJSON() {
		let data: Record<string, any> = {
			id: this.id,
			text: this.text,
			notes: this.notes
		}

		if (this._side) { data.side = this._side; }
		if (this._color) { data.color = this._color; }
		if (this._icon) { data.icon = this._icon; }
		if (this._value) { data.value = this._value; }
		if (this._status) { data.status = this._status; }
		if (this._layout) { data.layout = this._layout.id; }
		if (!this._autoShape) { data.shape = this._shape.id; }
		if (this._collapsed) { data.collapsed = 1; }
		if (this.children.length) {
			data.children = this.children.map(child => child.toJSON());
		}

		return data;
	}

	/**
	 * Only when creating a new item. To merge existing items, use .mergeWith().
	 */
	fromJSON(data) {
		this.text = data.text;

		if (data.id) { this._id = data.id; }
		if (data.notes) { this.notes = data.notes; }
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

		(data.children || []).forEach(child => {
			this.insertChild(Item.fromJSON(child));
		});

		return this;
	}

	mergeWith(data) {
		var dirty = 0;

		if (this.text != data.text && !this.dom.text.contentEditable) { this.text = data.text; }

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

		(data.children || []).forEach((child, index) => {
			if (index >= this.children.length) { /* new child */
				this.insertChild(Item.fromJSON(child));
			} else { /* existing child */
				var myChild = this.children[index];
				if (myChild.id == child.id) { /* recursive merge */
					myChild.mergeWith(child);
				} else { /* changed; replace */
					this.removeChild(this.children[index]);
					this.insertChild(Item.fromJSON(child), index);
				}
			}
		});

		/* remove dead children */
		var newLength = (data.children || []).length;
		while (this.children.length > newLength) { this.removeChild(this.children[this.children.length-1]); }

		if (dirty == 1) { this.update({children:false}); }
		if (dirty == 2) { this.update({children:true}); }
	}

	clone() {
		var data = this.toJSON();

		var removeId = function(obj) {
			delete obj.id;
			obj.children && obj.children.forEach(removeId);
		}
		removeId(data);

		return Item.fromJSON(data);
	}

	select() {
		this.dom.node.classList.add("current");
		if (window.editor) {
			if (this.notes) {
				window.editor.setContent(this.notes);
			} else {
				window.editor.setContent('');
			}
		}
		this.map.ensureItemVisibility(this);
		MM.Clipboard.focus(); /* going to mode 2c */
		pubsub.publish("item-select", this);
	}

	deselect() {
		/* we were in 2b; finish that via 3b */
		if (MM.App.editing) { MM.Command.Finish.execute(); }
		this.dom.node.classList.remove("current");
	}

	/*
	 * This item changed in some way (typically one of its attributes has been changed).
	 * We need to re-render its immediate DOM and also prehaps recurse upwards/downwards.
	 *
	 * Nothing happens if not part of a map (or the map is not visible).
	 */
	update(options: Partial<typeof UPDATE_OPTIONS> = {}) {
		options = Object.assign({}, UPDATE_OPTIONS, options);

		var map = this.map;
		if (!map || !map.isVisible()) { return; }

		if (options.children) { // recurse downwards?
			let childUpdateOptions = { parent: false, children: true };
			this.children.forEach(child => child.update(childUpdateOptions));
		}

		pubsub.publish("item-change", this);

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
		this.dom.notes.classList.toggle("notes-indicator-visible", !!this.notes);

		this._updateValue();

		this.dom.node.classList.toggle("collapsed", this._collapsed);

		this.getLayout().update(this);
		this.getShape().update(this);

		// recurse upwards?
		if (options.parent && !this.isRoot()) { this.parent.update(); }
	}

	get text() { return this.dom.text.innerHTML; }
	set text(text: string) {
		this.dom.text.innerHTML = text;
		findLinks(this.dom.text);
		this.update();
	}

	get notes() { return this._notes; }
	set notes(notes: string) {
		this._notes = notes;
		this.update();
	}

	collapse() {
		if (this._collapsed) { return; }
		this._collapsed = true;
		this.update();
	}

	expand() {
		if (!this._collapsed) { return; }
		this._collapsed = false;
		this.update();
		this.update({children:true});
	}

	isCollapsed() {
		return this._collapsed;
	}

	setValue(value) {
		this._value = value;
		this.update();
	}

	getValue() {
		return this._value;
	}

	getComputedValue() {
		return this._computed.value;
	}

	setStatus(status) {
		this._status = status;
		this.update();
	}

	getStatus() {
		return this._status;
	}

	get icon() { return this._icon; }
	set icon(icon: string) {
		this._icon = icon;
		this.update();
	}

	getComputedStatus() {
		return this._computed.status;
	}

	setSide(side) {
		this._side = side;
		// FIXME no .update() call, because the whole map needs updating?
		return this;
	}

	getSide() {
		return this._side;
	}

	setColor(color) {
		this._color = color;
		this.update({children:true});
	}

	getColor() {
		return this._color || (this.isRoot() ? COLOR : this.parent.getColor());
	}

	getOwnColor() {
		return this._color;
	}

	getLayout() {
		return this._layout || this.parent.getLayout();
	}

	getOwnLayout() {
		return this._layout;
	}

	setLayout(layout) {
		this._layout = layout;
		this.update({children:true});
	}

	getShape() {
		return this._shape;
	}

	getOwnShape() {
		return (this._autoShape ? null : this._shape);
	}

	setShape(shape) {
		if (this._shape) { this._shape.unset(this); }

		if (shape) {
			this._autoShape = false;
			this._shape = shape;
		} else {
			this._autoShape = true;
			this._shape = this._getAutoShape();
		}

		this._shape.set(this);
		this.update();
	}

	get map() {
		let item = this.parent;
		while (item) {
			if (item instanceof MM.Map) { return item; }
			item = item.parent;
		}
		return null;
	}

	isRoot() {
		return (this.parent instanceof MM.Map);
	}

	insertChild(child: Item, index?: number) {
		/* Create or remove child as necessary. This must be done before computing the index (inserting own child) */
		if (!child) {
			child = new Item();
		} else if (child.parent && child.parent.removeChild) { /* only when the child has non-map parent */
			child.parent.removeChild(child);
		}

		if (!this.children.length) {
			this.dom.node.appendChild(this.dom.toggle);
			this.dom.node.appendChild(this.dom.children);
		}

		if (arguments.length < 2) { index = this.children.length; }

		var next = null;
		if (index < this.children.length) { next = this.children[index].dom.node; }
		this.dom.children.insertBefore(child.dom.node, next);
		this.children.splice(index, 0, child);

		child.parent = this;
	}

	removeChild(child: Item) {
		var index = this.children.indexOf(child);
		this.children.splice(index, 1);
		var node = child.dom.node;
		node.parentNode.removeChild(node);

		child.parent = null;

		if (!this.children.length) {
			this.dom.toggle.parentNode.removeChild(this.dom.toggle);
			this.dom.children.parentNode.removeChild(this.dom.children);
		}

		this.update();
	}

	startEditing() {
		this._oldText = this.text;
		this.dom.text.contentEditable = "true";
		this.dom.text.focus(); /* switch to 2b */
		document.execCommand("styleWithCSS", null, "false");

		this.dom.text.addEventListener("input", this);
		this.dom.text.addEventListener("keydown", this);
		this.dom.text.addEventListener("blur", this);
	}

	stopEditing() {
		this.dom.text.removeEventListener("input", this);
		this.dom.text.removeEventListener("keydown", this);
		this.dom.text.removeEventListener("blur", this);

		this.dom.text.blur();
		this.dom.text.contentEditable = "false";
		var result = this.dom.text.innerHTML;
		this.dom.text.innerHTML = this._oldText;
		this._oldText = "";

		this.update(); /* text changed */

		MM.Clipboard.focus();

		return result;
	}

	handleEvent(e) {
		switch (e.type) {
			case "input":
				this.update();
				this.map.ensureItemVisibility(this);
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

	_getAutoShape() {
		let depth = 0;
		let node: Item | null = this;
		while (!node.isRoot()) {
			depth++;
			node = node.parent;
		}
		switch (depth) {
			case 0: return MM.Shape.Ellipse;
			case 1: return MM.Shape.Box;
			default: return MM.Shape.Underline;
		}
	}

	_updateStatus() {
		this.dom.status.className = "status";
		this.dom.status.hidden = false;

		var status = this._status;
		if (this._status == "computed") {
			var childrenStatus = this.children.every(function(child) {
				return (child.getComputedStatus() !== false);
			});
			status = (childrenStatus ? "yes" : "no");
		}

		switch (status) {
			case "yes":
				this.dom.status.classList.add("yes");
				this._computed.status = true;
			break;

			case "no":
				this.dom.status.classList.add("no");
				this._computed.status = false;
			break;

			default:
				this._computed.status = null;
				this.dom.status.hidden = true;
			break;
		}
	}

	_updateIcon() {
		var icon = this._icon;

		this.dom.icon.className = "icon";
		this.dom.icon.hidden = !icon;

		if (icon) {
			this.dom.icon.classList.add('fa');
			this.dom.icon.classList.add(icon);
		}
	}

	_updateValue() {
		this.dom.value.hidden = false;

		if (typeof(this._value) == "number") {
			this._computed.value = this._value;
			this.dom.value.textContent = String(this._value);
			return;
		}

		var childValues = this.children.map(function(child) {
			return child.getComputedValue();
		});

		var result = 0;
		switch (this._value) {
			case "sum":
				result = childValues.reduce((prev, cur) => prev+cur, 0);
			break;

			case "avg":
				var sum = childValues.reduce((prev, cur) => prev+cur, 0);
				result = (childValues.length ? sum/childValues.length : 0);
			break;

			case "max":
				result = Math.max(...childValues);
			break;

			case "min":
				result = Math.min(...childValues);
			break;

			default:
				this._computed.value = 0;
				this.dom.value.innerHTML = "";
				this.dom.value.hidden = true;
				return;
			break;
		}
		this._computed.value = result;
		this.dom.value.innerHTML = String(Math.round(result) == result ? result : result.toFixed(3));
	}
}


function findLinks(node) {
	var children = [].slice.call(node.childNodes);
	for (var i=0;i<children.length;i++) {
		var child = children[i];
		switch (child.nodeType) {
			case 1: /* element */
				if (child.nodeName.toLowerCase() == "a") { continue; }
				findLinks(child);
			break;

			case 3: /* text */
				var result = child.nodeValue.match(RE);
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

function generateId() {
	let str = "";
	for (var i=0;i<8;i++) {
		let code = Math.floor(Math.random()*26);
		str += String.fromCharCode("a".charCodeAt(0) + code);
	}
	return str;
}

(MM as any).Item = Item;



