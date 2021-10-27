import Item from "../item.js";


export default abstract class Layout {
	protected SPACING_CHILD = 4;

	constructor(readonly id:string, readonly label:string, protected childDirection="right") {
		repo.set(this.id, this);
	}

	abstract update(item: Item): void;

	get option() { return new Option(this.label, this.id); }

	/**
	 * @param child Child node (its parent uses this layout)
	 */
	getChildDirection(_child: Item) {
		return this.childDirection;
	}

	computeAlignment(item) {
		let direction = (item.isRoot ? this.childDirection : item.parent.resolvedLayout.getChildDirection(item));
		if (direction == "left") { return "right"; }
		return "left";
	}

	pick(item, dir) {
		var opposite = {
			left: "right",
			right: "left",
			top: "bottom",
			bottom: "top"
		}

		/* direction for a child */
		if (!item.collapsed) {
			var children = item.children;
			for (var i=0;i<children.length;i++) {
				var child = children[i];
				if (this.getChildDirection(child) == dir) { return child; }
			}
		}

		if (item.isRoot) { return item; }

		var parentLayout = item.parent.resolvedLayout;
		var thisChildDirection = parentLayout.getChildDirection(item);
		if (thisChildDirection == dir) {
			return item;
		} else if (thisChildDirection == opposite[dir]) {
			return item.parent;
		} else {
			return parentLayout.pickSibling(item, (dir == "left" || dir == "top" ? -1 : +1));
		}
	}

	pickSibling(item, dir) {
		if (item.isRoot) { return item; }

		var children = item.parent.children;
		var index = children.indexOf(item);
		index += dir;
		index = (index+children.length) % children.length;
		return children[index];
	}

	protected positionToggle(item: Item, point: number[]) {
		item.dom.toggle.setAttribute("transform", `translate(${point.map(Math.round)})`);
	}

	protected getChildAnchor(item, side) {
		let { position, contentPosition, contentSize } = item;
		if (side == "left" || side == "right") {
			var pos = position[0] + contentPosition[0];
			if (side == "left") { pos += contentSize[0]; }
		} else {
			var pos = position[1] + contentPosition[1];
			if (side == "top") { pos += contentSize[1]; }
		}
		return pos;
	}

	protected computeChildrenBBox(children, childIndex) {
		// FIXME pocita i kdyz jsou skryte
		var bbox = [0, 0];
		var rankIndex = (childIndex+1) % 2;

		children.forEach(child => {
			const { size } = child;

			bbox[rankIndex] = Math.max(bbox[rankIndex], size[rankIndex]); /* adjust cardinal size */
			bbox[childIndex] += size[childIndex]; /* adjust orthogonal size */
		});

		if (children.length > 1) { bbox[childIndex] += this.SPACING_CHILD * (children.length-1); } /* child separation */

		return bbox;
	}
}

export const repo = new Map<string, Layout>();
