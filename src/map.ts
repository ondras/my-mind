import Item, { Jsonified as JsonifiedItem } from "./item.js";
import Layout, { repo as layoutRepo, Direction } from "./layout/layout.js";
import { br2nl } from "./format/format.js";
import * as svg from "./svg.js";
import * as html from "./html.js";
import * as app from "./my-mind.js";


let css = "";

const UPDATE_OPTIONS = {
	children: true
}

interface Options {
	root: string;
	layout: Layout;
}

interface PickCandidate {
	item: Item;
	dist: number;
}

export type Jsonified = {
	root: JsonifiedItem;
}

export default class Map {
	readonly node = svg.node("svg");
	protected style = html.node("style");
	protected _root!: Item;
	protected position = [0, 0];
	protected fontSize = 15;

	constructor(options?: Partial<Options>) {
		let resolvedOptions = Object.assign({
			root: "My Mind Map",
			layout: layoutRepo.get("map")!
		}, options);

		this.style.textContent = css;
		this.node.style.fontSize = `${this.fontSize}px`;

		let root = new Item();
		root.text = resolvedOptions.root;
		root.layout = resolvedOptions.layout;
		this.root = root;
	}

	static fromJSON(data: Jsonified) {
		return new this().fromJSON(data);
	}

	toJSON() {
		let data: Jsonified = {
			root: this._root.toJSON()
		};
		return data;
	}

	fromJSON(data: Jsonified) {
		this.root = Item.fromJSON(data.root);
		return this;
	}

	get root() { return this._root; }
	protected set root(root: Item) {
		const { node, style } = this;
		this._root = root;

		node.innerHTML = "";
		node.append(root.dom.node, style);

		root.parent = this;
	}

	adjustFontSize(diff: -1 | 1) {
		this.fontSize = Math.max(8, this.fontSize + 2*diff);
		this.node.style.fontSize = `${this.fontSize}px`;
		this.update();
		this.ensureItemVisibility(app.currentItem);
	}


	mergeWith(data: Jsonified) {
		// store a sequence of nodes to be selected when merge is over
		let ids: string[] = [];
		var current = app.currentItem;
		var node = current;
		while (true) {
			ids.push(node.id);
			if (node.parent == this) { break; }
			node = node.parent as Item;
		}

		this._root.mergeWith(data.root);

		if (current.map) { /* selected node still in tree, cool */
			/* if one of the parents got collapsed, act as if the node got removed */
			let node = current;
			let hidden = false;
			while (true) {
				if (node.parent == this) { break; }
				node = node.parent as Item;
				if (node.collapsed) { hidden = true; }
			}
			if (!hidden) { return; } /* nothing bad happened, continue */
		}

		/* previously selected node is no longer in the tree OR it is folded */

		/* what if the node was being edited? */
		app.editing && app.stopEditing();

		/* get all items by their id */
		var idMap: Record<string, Item> = {};
		var scan = function(item: Item) {
			idMap[item.id] = item;
			item.children.forEach(scan);
		}
		scan(this._root);

		/* select the nearest existing parent */
		while (ids.length) {
			var id = ids.shift()!;
			if (id in idMap) {
				app.selectItem(idMap[id]);
				return;
			}
		}
	}

	get isVisible() { return !!this.node.parentNode; }

	update(options?: Partial<typeof UPDATE_OPTIONS>) {
		options = Object.assign({}, UPDATE_OPTIONS, options);

		options.children && this._root.update({parent:false, children:true});

		const { node } = this;
		const { size } = this._root;
		node.setAttribute("width", String(size[0]));
		node.setAttribute("height", String(size[1]));
	}

	show(where: HTMLElement) {
		where.append(this.node);

		this.update();
		this.center();
		app.selectItem(this._root);
	}

	hide() {
		this.node.remove();
	}

	center() {
		let { size } = this._root;
		let parent = this.node.parentNode as HTMLElement;

		let position = [
			(parent.offsetWidth - size[0])/2,
			(parent.offsetHeight - size[1])/2
		].map(Math.round);

		this.moveTo(position);
	}

	moveBy(diff: number[]) {
		let position = this.position.map((p, i) => p + diff[i]);
		return this.moveTo(position);
	}

	getClosestItem(point: number[]) {
		interface DistanceRecord {
			dx: number;
			dy: number;
			distance: number;
			item: Item;
		}
		let all: DistanceRecord[] = [];

		function scan(item: Item) {
			let rect = item.dom.content.getBoundingClientRect();
			let dx = rect.left + rect.width/2 - point[0];
			let dy = rect.top + rect.height/2 - point[1];
			let distance = dx*dx+dy*dy;
			all.push({dx, dy, item, distance});
			if (!item.collapsed) { item.children.forEach(scan); }
		}

		scan(this._root);

		all.sort((a, b) => a.distance - b.distance);

		return all[0];
	}

	getItemFor(node: Element): Item | undefined {
		let content = node.closest(".content");
		if (!content) { return; }

		function scanForContent(item: Item): Item | undefined {
			if (item.dom.content == content) { return item; }

			for (let child of item.children) {
				let found = scanForContent(child);
				if (found) { return found; }
			}
		}

		return scanForContent(this._root);
	}

	ensureItemVisibility(item: Item) {
		const padding = 10;

		let itemRect = item.dom.content.getBoundingClientRect();
		var parentRect = (this.node.parentNode as HTMLElement).getBoundingClientRect();

		var delta = [0, 0];

		var dx = parentRect.left-itemRect.left+padding;
		if (dx > 0) { delta[0] = dx; }
		var dx = parentRect.right-itemRect.right-padding;
		if (dx < 0) { delta[0] = dx; }

		var dy = parentRect.top-itemRect.top+padding;
		if (dy > 0) { delta[1] = dy; }
		var dy = parentRect.bottom-itemRect.bottom-padding;
		if (dy < 0) { delta[1] = dy; }

		if (delta[0] || delta[1]) { this.moveBy(delta); }
	}

	get name() {
		let name = this._root.text;
		return br2nl(name).replace(/\n/g, " ").replace(/<.*?>/g, "").trim();
	}

	get id() { return this._root.id; }

	pick(item: Item, direction: Direction) {
		let candidates: PickCandidate[] = [];
		var currentRect = item.dom.content.getBoundingClientRect();

		this.getPickCandidates(currentRect, this._root, direction, candidates);
		if (!candidates.length) { return item; }

		candidates.sort((a, b) => a.dist - b.dist);

		return candidates[0].item;
	}

	protected getPickCandidates(currentRect: DOMRect, item: Item, direction: Direction, candidates: PickCandidate[]) {
		if (!item.collapsed) {
			item.children.forEach(child => {
				this.getPickCandidates(currentRect, child, direction, candidates);
			});
		}

		var node = item.dom.content;
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

	protected moveTo(point: number[]) {
		this.position = point;
		this.node.style.left = `${point[0]}px`;
		this.node.style.top = `${point[1]}px`;
	}
}

export async function init() {
	let response = await fetch("map.css");
	css = await response.text();
}