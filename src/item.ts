import * as html from "./html.js";
import * as svg from "./svg.js";
import * as pubsub from "./pubsub.js";
import Shape, { repo as shapeRepo } from "./shape/shape.js";
import Layout, { repo as layoutRepo } from "./layout/layout.js";

declare global {
	interface Window {
		editor: any;
	}
}

export type ValueType = string | number | null;
export type StatusType = "computed" | boolean | null;
export type Side = "left" | "right";

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
	protected _id = generateId();
	protected _parent: Item | null = null;
	protected _collapsed = false;
	protected _icon: string | null = null;
	protected _notes: string | null = null;
	protected _value: ValueType = null;
	protected _status: StatusType = null;
	protected _color: string | null = null;
	protected _side: Side | null = null; // side preference
	protected _shape: Shape | null = null;
	protected _layout: Layout | null = null;
	protected originalText = "";

	dom = {
		node: svg.group(),
		connectors: svg.group(),
		content: html.node("div"),
		notes: html.node("div"),
		status: html.node("span"),
		icon: html.node("span"),
		value: html.node("span"),
		text: html.node("div"),
		toggle: html.node("div")
	}

	readonly children: Item[] = [];

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
		dom.icon.classList.add("icon");

		let foContent = svg.foreignObject();
		dom.node.append(dom.connectors, foContent);

		foContent.append(dom.content);

		dom.content.append(dom.status, dom.value, dom.icon, dom.text, dom.notes);
		/* toggle+children are appended when children exist */

		dom.toggle.addEventListener("click", this);
	}

	get id() { return this._id; }

	get parent() { return this._parent; }
	set parent(parent: Item | null) {
		this._parent = parent;
		this.update({children:true});
	}

	get size() {
		const bbox = this.dom.node.getBBox();
		return [bbox.width, bbox.height];
	}

	get position() {
		const { node } = this.dom;
		const transform = node.getAttribute("transform");
		return transform.match(/\d+/g).map(Number);
	}
	set position(position: number[]) {
		const { node } = this.dom;
		const transform = `translate(${position.join(" ")})`;
		node.setAttribute("transform", transform);
	}

	get contentSize() {
		const { content } = this.dom;
		const fo = content.parentNode as SVGForeignObjectElement;
		return [fo.getAttribute("width"), fo.getAttribute("height")].map(Number);
	}

	get contentPosition() {
		const { content } = this.dom;
		const fo = content.parentNode as SVGForeignObjectElement;
		return [fo.getAttribute("x"), fo.getAttribute("y")].map(Number);
	}
	set contentPosition(position: number[]) {
		const { content } = this.dom;
		const fo = content.parentNode as SVGForeignObjectElement;
		fo.setAttribute("x", String(position[0]));
		fo.setAttribute("y", String(position[1]));
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
		if (this._shape) { data.shape = this._shape.id; }
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
			// backwards compatibility for yes/no
			if (data.status == "yes") {
				this._status = true;
			} else if (data.status == "no") {
				this._status = false;
			} else {
				this._status = data.status;
			}
		}
		if (data.collapsed) { this.collapse(); }
		if (data.layout) { this._layout = layoutRepo.get(data.layout); }
		if (data.shape) { this.shape = shapeRepo.get(data.shape); }

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

		if (this.layout != data.layout) {
			this._layout = layoutRepo.get(data.layout);
			dirty = 2;
		}

		if (this.shape != data.shape) { this.shape = shapeRepo.get(data.shape); }

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

		// remove dead children
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

		const { map, children } = this;

		if (!map || !map.isVisible()) { return; }

		if (options.children) { // recurse downwards?
			let childUpdateOptions = { parent: false, children: true };
			children.forEach(child => child.update(childUpdateOptions));
		}

		pubsub.publish("item-change", this);

		this.updateStatus();
		this.updateIcon();
		this.updateValue();


		const { resolvedLayout, resolvedShape, dom } = this;

		dom.notes.classList.toggle("notes-indicator-visible", !!this.notes);
		dom.node.classList.toggle("collapsed", this._collapsed);
		dom.node.dataset.shape = resolvedShape.id; // applies css => modifies dimensions (necessary for layout)
		dom.node.dataset.align = resolvedLayout.computeAlignment(this); // applies css => modifies dimensions (necessary for layout)

		let fo = dom.content.parentNode as SVGForeignObjectElement;
		console.log(dom.content.offsetHeight, dom.text.textContent);
		fo.setAttribute("width", String(dom.content.offsetWidth));
		fo.setAttribute("height", String(dom.content.offsetHeight));

//		if (this.id == "ezwvmtko") debugger;

		dom.connectors.innerHTML = "";
		resolvedLayout.update(this);
		resolvedShape.update(this); // needs layout -> draws second

		// recurse upwards?
		if (options.parent && !this.isRoot) { this.parent.update(); }
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

	get value() { return this._value; }
	set value(value: ValueType) {
		this._value = value;
		this.update();
	}
	get resolvedValue(): number {
		const value = this._value;

		if (typeof(value) == "number") { return value; }

		let childValues = this.children.map(child => child.resolvedValue);

		switch (value) {
			case "max": return Math.max(...childValues); break;
			case "min": return Math.min(...childValues); break;
			case "sum": return childValues.reduce((prev, cur) => prev+cur, 0); break;

			case "avg":
				var sum = childValues.reduce((prev, cur) => prev+cur, 0);
				return (childValues.length ? sum/childValues.length : 0);
			break;

			default: return 0; break;
		}
	}

	get status() { return this._status; }
	set status(status: StatusType) {
		this._status = status;
		this.update();
	}
	get resolvedStatus(): boolean | null {
		let status = this._status;
		if (status == "computed") {
			return this.children.every(child => {
				return (child.resolvedStatus !== false);
			});
		} else {
			return status;
		}
	}

	get icon() { return this._icon; }
	set icon(icon: string) {
		this._icon = icon;
		this.update();
	}

	get side() { return this._side; }
	set side(side: Side) {
		this._side = side;
		// no .update() call, because the whole map needs updating
	}

	get color() { return this._color; }
	set color(color: string | null) {
		this._color = color;
		this.update({children:true});
	}
	get resolvedColor(): string {
		return this._color || (this.isRoot ? COLOR : this.parent.resolvedColor);
	}

	get layout() { return this._layout; }
	set layout(layout: Layout | null) {
		this._layout = layout;
		this.update({children:true});
	}
	get resolvedLayout() {
		return this._layout || this.parent.resolvedLayout;
	}

	get shape() { return this._shape; }
	set shape(shape: Shape | null) {
		this._shape = shape;
		this.update()
	}
	get resolvedShape() {
		if (this._shape) { return this._shape; }

		let depth = 0;
		let node: Item | null = this;
		while (!node.isRoot) {
			depth++;
			node = node.parent;
		}
		switch (depth) {
			case 0: return shapeRepo.get("ellipse");
			case 1: return shapeRepo.get("box");
			default: return shapeRepo.get("underline");
		}
	}

	get map() {
		let item = this.parent;
		while (item) {
			if (item instanceof MM.Map) { return item; }
			item = item.parent;
		}
		return null;
	}

	get isRoot() { return (this.parent instanceof MM.Map); }

	insertChild(child: Item, index?: number) {
		/* Create or remove child as necessary. This must be done before computing the index (inserting own child) */
		if (!child) {
			child = new Item();
		} else if (child.parent && child.parent.removeChild) { /* only when the child has non-map parent */
			child.parent.removeChild(child);
		}

		if (!this.children.length) {
			this.dom.node.appendChild(this.dom.toggle);
		}

		if (arguments.length < 2) { index = this.children.length; }

		var next = null;
		if (index < this.children.length) { next = this.children[index].dom.node; }
		this.dom.node.insertBefore(child.dom.node, next);
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
		}

		this.update();
	}

	startEditing() {
		this.originalText = this.text;
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
		this.dom.text.innerHTML = this.originalText;
		this.originalText = "";

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

	protected updateStatus() {
		const { resolvedStatus, dom } = this;
		dom.status.className = "status";
		dom.status.hidden = false;

		switch (resolvedStatus) {
			case true: dom.status.classList.add("yes"); break;
			case false: dom.status.classList.add("no"); break;
			default: dom.status.hidden = true; break;
		}
	}

	protected updateIcon() {
		var icon = this._icon;

		this.dom.icon.className = "icon"; // completely reset
		this.dom.icon.hidden = !icon;

		if (icon) {
			this.dom.icon.classList.add("fa");
			this.dom.icon.classList.add(icon);
		}
	}

	protected updateValue() {
		const { dom, _value } = this;

		if (_value === null) {
			dom.value.hidden = true;
			return;
		}

		dom.value.hidden = false;

		if (typeof(_value) == "number") { // exact values are not rounded
			dom.value.textContent = String(_value);
		} else {
			let resolved = this.resolvedValue; // computed values are rounded to 3 decimals if need rounding
			dom.value.textContent = String(Math.round(resolved) == resolved ? resolved : resolved.toFixed(3));
		}
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



