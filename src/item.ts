import * as html from "./html.js";
import * as svg from "./svg.js";
import * as pubsub from "./pubsub.js";
import * as app from "./my-mind.js";
import { repo as commandRepo } from "./command/command.js";
import Shape, { repo as shapeRepo } from "./shape/shape.js";
import Layout, { repo as layoutRepo } from "./layout/layout.js";
import Map from "./map.js";


export const TOGGLE_SIZE = 6;
export type Value = string | number | null;
export type Status = "computed" | boolean | null;
export type Side = "left" | "right" | null;
export type ChildItem = Item & { parent: Item };

export type Jsonified = Partial<{
	id: string;
	notes: string;
	side: Side;
	color: string;
	textColor: string;
	icon: string;
	value: Value;
	status: Status | "yes" | "no";
	layout: string;
	shape: string;
	collapsed: boolean | number;
	children: Jsonified[];
}> & {
	text: string;
}

const UPDATE_OPTIONS = {
	parent: true,
	children: false
}

export default class Item {
	protected _id = generateId();
	protected _parent: Item | Map | null = null;
	protected _collapsed = false;
	protected _icon = "";
	protected _notes = "";
	protected _color = "";
	protected _textColor = "";
	protected _value: Value = null;
	protected _status: Status = null;
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
		toggle: buildToggle()
	}

	readonly children: ChildItem[] = [];

	static fromJSON(data: Jsonified) {
		return new this().fromJSON(data);
	}

	constructor() {
		const { dom } = this;
		dom.node.classList.add("item");
		dom.content.classList.add("content");
		dom.notes.classList.add("notes");
		dom.status.classList.add("status");
		dom.icon.classList.add("icon");
		dom.value.classList.add("value");
		dom.text.classList.add("text");
		dom.icon.classList.add("icon");

		this.notes = ""; // hide the node

		let fo = svg.foreignObject();
		dom.node.append(dom.connectors, fo);

		fo.append(dom.content);

		dom.content.append(dom.status, dom.value, dom.icon, dom.text, dom.notes);
		/* toggle+children are appended when children exist */

		dom.toggle.addEventListener("click", _ => {
			this.collapsed = !this.collapsed;
			app.selectItem(this);
		});

		this.updateToggle();
	}

	get id() { return this._id; }

	get parent() { return this._parent; }
	set parent(parent: Item | Map | null) {
		this._parent = parent;
		this.update({children:true});
	}

	get size() {
		const bbox = this.dom.node.getBBox();
		return [bbox.width, bbox.height];
	}

	get position() {
		const { node } = this.dom;
		const transform = node.getAttribute("transform")!;
		return transform.match(/\d+/g)!.map(Number); // fixme store in some property?
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
		let data: Jsonified = {
			id: this.id,
			text: this.text,
			notes: this.notes
		}

		if (this._side) { data.side = this._side; }
		if (this._color) { data.color = this._color; }
		if (this._textColor) { data.textColor = this._textColor; }
		if (this._icon) { data.icon = this._icon; }
		if (this._value !== null) { data.value = this._value; }
		if (this._status !== null) { data.status = this._status; }
		if (this._layout) { data.layout = this._layout.id; }
		if (this._shape) { data.shape = this._shape.id; }
		if (this._collapsed) { data.collapsed = true; }
		if (this.children.length) {
			data.children = this.children.map(child => child.toJSON());
		}

		return data;
	}

	/**
	 * Only when creating a new item. To merge existing items, use .mergeWith().
	 */
	fromJSON(data: Jsonified) {
		this.text = data.text;

		if (data.id) { this._id = data.id; }
		if (data.notes) { this.notes = data.notes; }
		if (data.side) { this._side = data.side; }
		if (data.color) { this._color = data.color; }
		if (data.textColor) { this._textColor = data.textColor; }
		if (data.icon) { this._icon = data.icon; }
		if (data.value !== undefined) { this._value = data.value; }
		if (data.status !== undefined) {
			// backwards compatibility for yes/no
			if (data.status == "yes") {
				this._status = true;
			} else if (data.status == "no") {
				this._status = false;
			} else {
				this._status = data.status;
			}
		}
		if (data.collapsed) { this.collapsed = !!data.collapsed; } // invoke setter -> set text
		if (data.layout) { this._layout = layoutRepo.get(data.layout)!; }
		if (data.shape) { this.shape = shapeRepo.get(data.shape)!; }

		(data.children || []).forEach(child => {
			this.insertChild(Item.fromJSON(child));
		});

		return this;
	}

	mergeWith(data: Jsonified) {
		var dirty = 0;

		if (this.text != data.text && !this.dom.text.contentEditable) { this.text = data.text; }

		if (this._side != data.side) {
			this._side = data.side || null;
			dirty = 1;
		}

		if (this._color != data.color) {
			this._color = data.color || "";
			dirty = 2;
		}

		if (this._textColor != data.textColor) {
			this._textColor = data.textColor || "";
			dirty = 2;
		}

		if (this._icon != data.icon) {
			this._icon = data.icon || "";
			dirty = 1;
		}

		if (this._value != data.value) {
			this._value = data.value || null;
			dirty = 1;
		}

		if (this._status != data.status) {
			this._status = data.status as Status;
			dirty = 1;
		}

		if (this._collapsed != !!data.collapsed) { this.collapsed = !!data.collapsed; }

		// fixme does not work
		let ourShapeId = (this._shape ? this._shape.id : null);
		if (ourShapeId != data.shape) {
			this._shape = (data.shape ? shapeRepo.get(data.shape)! : null);
			dirty = 1;
		}

		let ourLayoutId = (this._layout ? this._layout.id : null)
		if (ourLayoutId != data.layout) {
			this._layout = (data.layout ? layoutRepo.get(data.layout)! : null);
			dirty = 2;
		}

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
		let newLength = (data.children || []).length;
		while (this.children.length > newLength) { this.removeChild(this.children[this.children.length-1]); }

		if (dirty == 1) { this.update({children:false}); }
		if (dirty == 2) { this.update({children:true}); }
	}

	clone() {
		var data = this.toJSON();

		var removeId = function(obj: Jsonified) {
			delete obj.id;
			obj.children && obj.children.forEach(removeId);
		}
		removeId(data);

		return Item.fromJSON(data);
	}

	select() {
		this.dom.node.classList.add("current");
		pubsub.publish("item-select", this);
	}

	deselect() {
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

		const { map, children, parent } = this;

		if (!map || !map.isVisible) { return; }

		if (options.children) { // recurse downwards?
			let childUpdateOptions = { parent: false, children: true };
			children.forEach(child => child.update(childUpdateOptions));
		}

		pubsub.publish("item-change", this);

		this.updateStatus();
		this.updateIcon();
		this.updateValue();

		const { resolvedLayout, resolvedShape, dom } = this;
		const { content, node, connectors } = dom;

		dom.text.style.color = this.resolvedTextColor;
		node.dataset.shape = resolvedShape.id; // applies css => modifies dimensions (necessary for layout)
		node.dataset.align = resolvedLayout.computeAlignment(this); // applies css => modifies dimensions (necessary for layout)

		let fo = content.parentNode as SVGForeignObjectElement;
		let size = [
			Math.max(content.offsetWidth, content.scrollWidth),
			Math.max(content.offsetHeight, content.scrollHeight)
		]
		fo.setAttribute("width", String(size[0]));
		fo.setAttribute("height", String(size[1]));

		connectors.innerHTML = "";
		resolvedLayout.update(this);
		resolvedShape.update(this); // needs layout -> draws second

		// recurse upwards?
		if (options.parent && parent) { parent.update({children:false}); } // explicit children:false when the parent is a Map
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
		this.dom.notes.hidden = !notes; // no update necessary
	}

	get collapsed() { return this._collapsed; }
	set collapsed(collapsed: boolean) {
		this._collapsed = collapsed;
		this.updateToggle();

		let children = !collapsed; // update children if expanded
		this.update({children});
	}

	get value() { return this._value; }
	set value(value: Value) {
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
	set status(status: Status) {
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
	set side(side: Side | null) {
		this._side = side;
		// no .update() call, because the whole map needs updating
	}

	get color() { return this._color; }
	set color(color: string) {
		this._color = color;
		this.update({children:true});
	}
	get resolvedColor(): string {
		if (this._color) { return this._color; }

		const { parent } = this;
		if (parent instanceof Item) { return parent.resolvedColor; }

		return COLOR;
	}

	get textColor() { return this._textColor; }
	set textColor(textColor: string) {
		this._textColor = textColor;
		this.update({children:true});
	}
	get resolvedTextColor(): string {
		if (this._textColor) { return this._textColor; }

		const { parent } = this;
		if (parent instanceof Item) { return parent.resolvedTextColor; }

		return "";
	}

	get layout() { return this._layout; }
	set layout(layout: Layout | null) {
		this._layout = layout;
		this.update({children:true});
	}
	get resolvedLayout(): Layout {
		if (this._layout) { return this._layout; }

		const { parent } = this;
		if (!(parent instanceof Item)) { throw new Error("Non-connected item does not have layout"); }

		return parent.resolvedLayout;
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
			node = node.parent as Item; // always item, cannot be Map (would be root)
		}
		switch (depth) {
			case 0: return shapeRepo.get("ellipse")!;
			case 1: return shapeRepo.get("box")!;
			default: return shapeRepo.get("underline")!;
		}
	}

	get map() {
		let item = this.parent;
		while (item) {
			if (item instanceof Map) { return item; }
			item = item.parent;
		}
		return null;
	}

	get isRoot() { return (this.parent instanceof Map); }

	insertChild(child: Item, index?: number) {
		// Create or remove child as necessary. This must be done before computing the index (inserting own child)

		if (!child) {
			child = new Item();
		} else if (child.parent && child.parent instanceof Item) { // only when the child has non-map parent
			child.parent.removeChild(child);
		}

		if (!this.children.length) {
			this.dom.node.appendChild(this.dom.toggle);
		}

		if (index === undefined) { index = this.children.length; }

		var next = null;
		if (index < this.children.length) { next = this.children[index].dom.node; }
		this.dom.node.insertBefore(child.dom.node, next);
		this.children.splice(index, 0, child as ChildItem);

		child.parent = this;
	}

	removeChild(child: Item) {
		var index = this.children.indexOf(child as ChildItem);
		this.children.splice(index, 1);
		child.dom.node.remove();

		child.parent = null;

		(!this.children.length) && this.dom.toggle.remove();

		this.update();
	}

	startEditing() {
		this.originalText = this.text;
		this.dom.text.contentEditable = "true";
		this.dom.text.focus();
		document.execCommand("styleWithCSS", false, "false");

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
		let result = this.dom.text.innerHTML;
		this.dom.text.innerHTML = this.originalText;
		this.originalText = "";

		this.update(); // text changed

		return result;
	}

	handleEvent(e: Event) {
		switch (e.type) {
			case "input":
				this.update();
				this.map!.ensureItemVisibility(this);
			break;

			case "keydown":
				if ((e as KeyboardEvent).code == "Tab") { e.preventDefault(); } // TAB has a special meaning in this app, do not use it to change focus
			break;

			case "blur":
				commandRepo.get("finish")!.execute();
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

	protected updateToggle() {
		const { node, toggle } = this.dom;
		node.classList.toggle("collapsed", this._collapsed);
		toggle.querySelector("path")!.setAttribute("d", this._collapsed ? D_PLUS : D_MINUS);
	}
}


function findLinks(node: Element) {
	let children = [...node.childNodes];
	for (let i=0;i<children.length;i++) {
		let child = children[i];

		if (child instanceof Element) {
			if (child.nodeName.toLowerCase() == "a") { continue; }
			findLinks(child);
		}

		if (child instanceof Text) {
			let str = child.nodeValue!;
			let result = str.match(RE);
			if (!result) { continue; }

			let before = str.substring(0, result.index);
			let after = str.substring(result.index! + result[0].length);
			var link = document.createElement("a");
			link.innerHTML = link.href = result[0];

			if (before) {
				node.insertBefore(document.createTextNode(before), child);
			}

			node.insertBefore(link, child);

			if (after) {
				child.nodeValue = after;
				i--; // re-try with the aftertext
			} else {
				child.remove();
			}
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

const D_MINUS = `M ${-(TOGGLE_SIZE-2)} 0 L ${TOGGLE_SIZE-2} 0`;
const D_PLUS = `${D_MINUS} M 0 ${-(TOGGLE_SIZE-2)} L 0 ${TOGGLE_SIZE-2}`;

function buildToggle() {
	const circleAttrs = {"cx":"0", "cy":"0", "r":String(TOGGLE_SIZE)};

	let g = svg.group();
	g.classList.add("toggle");
	g.append(svg.node("circle", circleAttrs), svg.node("path"));

	return g;
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
