import Item, { ChildItem, Side, Value, Status } from "./item.js";
import * as app from "./my-mind.js";
import Layout from "./layout/layout.js";
import Shape from "./shape/shape.js";


export default abstract class Action {
	do() {}
	undo() {}
}

export class Multi extends Action {
	constructor(protected actions: Action[]) {
		super();
	}

	do() {
		this.actions.forEach(action => action.do())
	}

	undo() {
		this.actions.slice().reverse().forEach(action => action.undo());
	}
}

export class InsertNewItem extends Action {
	item = new Item();

	constructor(protected parent: Item, protected index: number) {
		super();
	}

	do() {
		this.parent.collapsed = false; // FIXME remember?
		this.parent.insertChild(this.item, this.index);
		app.selectItem(this.item);
	}

	undo() {
		this.parent.removeChild(this.item);
		app.selectItem(this.parent);
	}
}

export class AppendItem extends Action {
	constructor(protected parent: Item, protected item: Item) {
		super();
	}

	do() {
		this.parent.insertChild(this.item);
		app.selectItem(this.item);
	}

	undo() {
		this.parent.removeChild(this.item);
		app.selectItem(this.parent);
	}
}

export class RemoveItem extends Action {
	protected parent: Item;
	protected index: number;

	constructor(protected item: ChildItem) {
		super();
		this.parent = item.parent;
		this.index = this.parent.children.indexOf(this.item);
	}

	do() {
		this.parent.removeChild(this.item);
		app.selectItem(this.parent);
	}

	undo() {
		this.parent.insertChild(this.item, this.index);
		app.selectItem(this.item);
	}
}

export class MoveItem extends Action {
	protected oldParent: Item;
	protected oldIndex: number;
	protected oldSide: Side | null;

	constructor(protected item: ChildItem, protected newParent: Item, protected newIndex?: number, protected newSide: Side = null) {
		super();
		this.oldParent = item.parent;
		this.oldIndex = this.oldParent.children.indexOf(item);
		this.oldSide = item.side;
	}

	do() {
		const { item, newParent, newIndex, newSide } = this;
		item.side = newSide;
		if (newIndex === undefined) {
			newParent.insertChild(item);
		} else {
			newParent.insertChild(item, newIndex);
		}
		app.selectItem(item);
	}

	undo() {
		const { item, oldSide, oldIndex, oldParent, newParent } = this;
		item.side = oldSide;
		oldParent.insertChild(item, oldIndex);
		app.selectItem(newParent);
	}
}

export class Swap extends Action {
	protected parent: Item;
	protected sourceIndex: number;
	protected targetIndex: number;

	constructor(protected item: ChildItem, diff: -1 | 1) {
		super();
		this.parent = item.parent;

		let children = this.parent.children;
		let sibling = this.parent.resolvedLayout.pickSibling(item, diff);

		this.sourceIndex = children.indexOf(item);
		this.targetIndex = children.indexOf(sibling);
	}

	do() {
		this.parent.insertChild(this.item, this.targetIndex);
	}

	undo() {
		this.parent.insertChild(this.item, this.sourceIndex);
	}
}

export class SetLayout extends Action {
	protected oldLayout: Layout | null;

	constructor(protected item: Item, protected layout: Layout) {
		super();
		this.oldLayout = item.layout;
	}

	do() {
		this.item.layout = this.layout;
	}

	undo() {
		this.item.layout = this.oldLayout;
	}
}

export class SetShape extends Action {
	protected oldShape: Shape | null;

	constructor(protected item: Item, protected shape: Shape) {
		super();
		this.oldShape = item.shape;
	}

	do() {
		this.item.shape = this.shape;
	}

	undo() {
		this.item.shape = this.oldShape;
	}
}

export class SetColor extends Action {
	protected oldColor: string;

	constructor(protected item: Item, protected color: string) {
		super();
		this.oldColor = item.color;
	}

	do() {
		this.item.color = this.color;
	}

	undo() {
		this.item.color = this.oldColor;
	}
}

export class SetTextColor extends Action {
	protected oldTextColor: string;

	constructor(protected item: Item, protected textColor: string) {
		super();
		this.oldTextColor = item.textColor;
	}

	do() {
		this.item.textColor = this.textColor;
	}

	undo() {
		this.item.textColor = this.oldTextColor;
	}
}

export class SetText extends Action {
	protected oldText: string;
	protected oldValue: Value;

	constructor(protected item: Item, protected text: string) {
		super();
		this.oldText = item.text;
		this.oldValue = item.value; // adjusting text can also modify value!
	}

	do() {
		this.item.text = this.text;
		let numText = Number(this.text);
		if (String(numText) == this.text) { this.item.value = numText; }
	}

	undo() {
		this.item.text = this.oldText;
		this.item.value = this.oldValue;
	}
}

export class SetValue extends Action {
	protected oldValue: Value;

	constructor(protected item: Item, protected value: Value) {
		super();
		this.oldValue = item.value;
	}

	do() {
		this.item.value = this.value;
	}

	undo() {
		this.item.value = this.oldValue;
	}
}

export class SetStatus extends Action {
	protected oldStatus: Status;

	constructor(protected item: Item, protected status: Status) {
		super();
		this.oldStatus = item.status;
	}

	do() {
		this.item.status = this.status;
	}

	undo() {
		this.item.status = this.oldStatus;
	}
}

export class SetIcon extends Action {
	protected oldIcon: string;

	constructor(protected item: Item, protected icon: string) {
		super();
		this.oldIcon = item.icon;
	}

	do() {
		this.item.icon = this.icon;
	}

	undo() {
		this.item.icon = this.oldIcon;
	}
}

export class SetSide extends Action {
	protected oldSide: Side | null;

	constructor(protected item: Item, protected side: Side) {
		super();
		this.oldSide = item.side;
	}

	do() {
		this.item.side = this.side;
		this.item.update({children:true});
	}

	undo() {
		this.item.side = this.oldSide;
		this.item.update({children:true});
	}
}
