import GraphLayout, { SPACING_RANK } from "./graph.js";
import Item from "../item.js";
import { repo } from "./layout.js";
import * as svg from "../svg.js";


export default class MapLayout extends GraphLayout {
	protected LINE_THICKNESS = 8;

	update(item: Item) {
		if (item.isRoot) {
			this.layoutRoot(item);
		} else {
			var side = this.getChildDirection(item);
			repo.get(`graph-${side}`).update(item);
		}
	}

	getChildDirection(child: Item) {
		while (!child.parent.isRoot) {
			child = child.parent;
		}
		/* child is now the sub-root node */

		var side = child.side;
		if (side) { return side; }

		var counts = {left:0, right:0};
		var children = child.parent.children;
		for (var i=0;i<children.length;i++) {
			var side = children[i].side;
			if (!side) {
				side = (counts.right > counts.left ? "left" : "right");
				children[i].side = side;
			}
			counts[side]++;
		}

		return child.side;
	}

	pickSibling(item: Item, dir) {
		if (item.isRoot) { return item; }

		var parent = item.parent;
		var children = parent.children;
		if (parent.isRoot) {
			var side = this.getChildDirection(item);
			children = children.filter(child => this.getChildDirection(child) == side);
		}

		var index = children.indexOf(item);
		index += dir;
		index = (index+children.length) % children.length;
		return children[index];
	}

	protected layoutRoot(item: Item) {
		const { children, contentSize } = item;
		let childrenLeft: Item[] = [];
		let childrenRight: Item[] = [];
		let contentPosition = [0, 0];

		children.forEach(child => {
			var side = this.getChildDirection(child);

			if (side == "left") {
				childrenLeft.push(child);
			} else {
				childrenRight.push(child);
			}
		});

		var bboxLeft = this.computeChildrenBBox(childrenLeft, 1);
		var bboxRight = this.computeChildrenBBox(childrenRight, 1);
		var height = Math.max(bboxLeft[1], bboxRight[1], contentSize[1]);

		var left = 0;
		this.layoutChildren(childrenLeft, "left", [left, Math.round((height-bboxLeft[1])/2)], bboxLeft);
		left += bboxLeft[0];

		if (childrenLeft.length) { left += SPACING_RANK; }
		contentPosition[0] = left;
		left += contentSize[0];

		if (childrenRight.length) { left += SPACING_RANK; }
		this.layoutChildren(childrenRight, "right", [left, Math.round((height-bboxRight[1])/2)], bboxRight);
		left += bboxRight[0];

		contentPosition[1] = Math.round((height - contentSize[1])/2);
		item.contentPosition = contentPosition;

		this.drawRootConnectors(item, "left", childrenLeft);
		this.drawRootConnectors(item, "right", childrenRight);
	}

	protected drawRootConnectors(item: Item, side, children) {
		if (children.length == 0 || item.isCollapsed()) { return; }

		const { contentSize, contentPosition, resolvedShape, dom } = item;

		let x1 = contentPosition[0] + contentSize[0]/2;
		let y1 = resolvedShape.getVerticalAnchor(item);
		const half = this.LINE_THICKNESS/2;

		let paths = children.map(child => {
			const { resolvedColor, resolvedShape, position } = child;

			let x2 = this.getChildAnchor(child, side);
			let y2 = resolvedShape.getVerticalAnchor(child) + position[1];
			let angle = Math.atan2(y2-y1, x2-x1) + Math.PI/2;
			let dx = Math.cos(angle) * half;
			let dy = Math.sin(angle) * half;

			let d = [
				`M ${x1-dx} ${y1-dy}`,
				`Q ${(x2+x1)/2} ${y2} ${x2} ${y2}`,
				`Q ${(x2+x1)/2} ${y2} ${x1+dx} ${y1+dy}`,
				`Z`
			];

			let attrs = {
				d: d.join(" "),
				fill: resolvedColor,
				stroke: resolvedColor
			}
			return svg.node("path", attrs);
		});

		dom.connectors.append(...paths);
	}
}

new MapLayout("map", "Map");