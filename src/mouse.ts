import Item, { ChildItem } from "./item.js";
import * as menu from "./ui/context-menu.js";
import * as app from "./my-mind.js";
import Action, * as actions from "./action.js";
import { repo as commandRepo } from "./command/command.js";
import { Direction } from "./layout/layout.js";


const TOUCH_DELAY = 500;
const SHADOW_OFFSET = 5;

interface Current {
	mode: "" | "drag" | "pan";
	cursor: number[];
	item: Item | null;
	ghost: HTMLElement | null;
	ghostPosition: number[];
	previousDragState: DragState | null;
}

interface DragState {
	result: "" | "append" | "sibling",
	target: Item,
	direction: Direction
}

let touchContextTimeout: ReturnType<typeof setTimeout>;
let current: Current = {
	mode: "",
	cursor: [],
	item: null,
	ghost: null,
	ghostPosition: [],
	previousDragState: null
};
let port: HTMLElement;

export function init(port_: HTMLElement) {
	port = port_;

	port.addEventListener("touchstart", onDragStart);
	port.addEventListener("mousedown", onDragStart);

	port.addEventListener("click", e => {
		let item = app.currentMap.getItemFor(e.target as HTMLElement);
		if (app.editing && item == app.currentItem) { return; } // ignore on edited node
		item && app.selectItem(item);
	});

	port.addEventListener("dblclick", e => {
		let item = app.currentMap.getItemFor(e.target as HTMLElement);
		item && commandRepo.get("edit")!.execute();
	});

	port.addEventListener("wheel", e => {
		const { deltaY } = e;
		if (!deltaY) { return; }

		let dir: -1 | 1 = (deltaY > 0 ? -1 : 1);
		app.currentMap.adjustFontSize(dir);
	});

	port.addEventListener("contextmenu", e => {
		onDragEnd(e);
		e.preventDefault();

		let item = app.currentMap.getItemFor(e.target as HTMLElement);
		item && app.selectItem(item);

		menu.open([e.clientX, e.clientY]);
	});
}

function onDragStart(e: MouseEvent | TouchEvent) {
	let point = eventToPoint(e);
	if (!point) { return; }

	let item = app.currentMap.getItemFor(e.target as HTMLElement);
	if (app.editing) {
		if (item == app.currentItem) { return; } // ignore dnd on edited node
		commandRepo.get("finish")!.execute(); // clicked elsewhere => finalize edit
	}

	// ui loses focus, so that keyboard shortcuts can work
	(document.activeElement as HTMLElement).blur();

	// we can safely start drag
	current.cursor = point;
	if (item && !item.isRoot) {
		current.mode = "drag";
		current.item = item;
	} else {
		current.mode = "pan";
		port.style.cursor = "move";
	}

	if (e.type == "mousedown") {
		// to prevent blurring the clipboard node
		// also, no selection allowed
		// only for mouse - preventing touchstart would prevent Safari from emulating clicks
		e.preventDefault();

		port.addEventListener("mousemove", onDragMove);
		port.addEventListener("mouseup", onDragEnd);
	}

	if (e.type == "touchstart") { // context menu here, after we have the item
		touchContextTimeout = setTimeout(function() {
			item && app.selectItem(item);
			menu.open(point as number[]);
		}, TOUCH_DELAY);

		port.addEventListener("touchmove", onDragMove);
		port.addEventListener("touchend", onDragEnd);
	}
}

function onDragMove(e: MouseEvent | TouchEvent) {
	let point = eventToPoint(e);
	if (!point) { return; }

	clearTimeout(touchContextTimeout);

	e.preventDefault();
	let delta = [
		point[0] - current.cursor[0],
		point[1] - current.cursor[1]
	];
	current.cursor = point;

	switch (current.mode) {
		case "drag":
			if (!current.ghost) {
				port.style.cursor = "move";
				buildGhost(current.item!);
			}
			moveGhost(delta);
			let state = computeDragState();
			visualizeDragState(state);
		break;

		case "pan":
			app.currentMap.moveBy(delta);
		break;
	}
}

function onDragEnd(_e: MouseEvent | TouchEvent) {
	clearTimeout(touchContextTimeout);

	port.style.cursor = "";
	port.removeEventListener("mousemove", onDragMove);
	port.removeEventListener("mouseup", onDragEnd);

	const { mode, ghost } = current;

	if (mode == "pan") { return; } // no cleanup after panning

	if (ghost) {
		let state = computeDragState();
		finishDragDrop(state);
		ghost.remove();
		current.ghost = null;
	}

	current.item = null;
}

function buildGhost(item: Item) {
	const { content } = item.dom;
	let ghost = content.cloneNode(true) as HTMLElement;
	ghost.classList.add("ghost");
	port.append(ghost); // FIXME jinam

	let rect = content.getBoundingClientRect();
	current.ghost = ghost;
	current.ghostPosition = [rect.left, rect.top];
}

function moveGhost(delta: number[]) {
	let { ghostPosition } = current;
	let ghost = current.ghost!;

	ghostPosition[0] += delta[0];
	ghostPosition[1] += delta[1];
	ghost.style.left = `${ghostPosition[0]}px`;
	ghost.style.top = `${ghostPosition[1]}px`;
}

function finishDragDrop(state: DragState) {
	visualizeDragState(null);

	const { target, result, direction } = state;

	let action: Action;
	switch (result) {
		case "append":
			action = new actions.MoveItem(current.item as ChildItem, target);
		break;

		case "sibling":
			let targetChildItem = target as ChildItem;
			let index = targetChildItem.parent.children.indexOf(targetChildItem);
			let targetIndex = index + (direction == "right" || direction == "bottom" ? 1 : 0);
			action = new actions.MoveItem(current.item as ChildItem, targetChildItem.parent, targetIndex, targetChildItem.side);
		break;

		default: return; break;
	}

	app.action(action);
}

/**
 * Compute a state object for a drag: current result (""/"append"/"sibling"), parent/sibling, direction
 */
function computeDragState() {
	let rect = current.ghost!.getBoundingClientRect();
	let point = [rect.left + rect.width/2, rect.top + rect.height/2];
	let closest = app.currentMap.getClosestItem(point);
	let target = closest.item;

	let state: DragState = {
		result: "",
		target,
		direction: "left"
	}

	let tmp = target;
	while (!tmp.isRoot) {
		if (tmp == current.item) { return state; } // drop on a child or self
		tmp = tmp.parent as Item;
	}

	let itemContentSize = current.item!.contentSize;
	let targetContentSize = target.contentSize;
	const w = Math.max(itemContentSize[0], targetContentSize[0]);
	const h = Math.max(itemContentSize[1], targetContentSize[1]);

	if (target.isRoot) { // append here
		state.result = "append";
	} else if (Math.abs(closest.dx) < w && Math.abs(closest.dy) < h) { // append here
		state.result = "append";
	} else {
		state.result = "sibling";
		let childDirection = (target as ChildItem).parent.resolvedLayout.getChildDirection(target);

		if (childDirection == "left" || childDirection == "right") {
			state.direction = (closest.dy < 0 ? "bottom" : "top");
		} else {
			state.direction = (closest.dx < 0 ? "right" : "left");
		}
	}

	return state;
}

function visualizeDragState(state: DragState | null) {
	let { previousDragState } = current;
	if (previousDragState && state &&
		previousDragState.target == state.target &&
		previousDragState.result == state.result) { return; } // nothing changed

	if (previousDragState) { // remove old vis
		previousDragState.target.dom.content.style.boxShadow = "";
	}

	if (!state) { return; }

	// show new vis
	let x = 0, y = 0;
	if (state.result == "sibling") {
		if (state.direction == "left") { x = -1; }
		if (state.direction == "right") { x = +1; }
		if (state.direction == "top") { y = -1; }
		if (state.direction == "bottom") { y = +1; }
	}
	let spread = (x || y ? -2 : 2);
	state.target.dom.content.style.boxShadow = `${x*SHADOW_OFFSET}px ${y*SHADOW_OFFSET}px 2px ${spread}px #000`;

	current.previousDragState = state;
}

function eventToPoint(e: MouseEvent | TouchEvent) {
	if ("touches" in e) {
		if (e.touches.length > 1) { return null; }
		return [e.touches[0].clientX, e.touches[0].clientY];
	} else {
		return [e.clientX, e.clientY]
	}
}
