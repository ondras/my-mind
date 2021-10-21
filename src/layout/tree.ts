import Layout from "./layout.js";
import Item from "../item.js";
import * as svg from "../svg.js";


const SPACING_RANK = 32;
const R = SPACING_RANK/4;

export default class TreeLayout extends Layout {

	update(item: Item) {
		this.layoutItem(item, this.childDirection);
		this.drawLines(item, this.childDirection);
	}

	protected layoutItem(item: Item, rankDirection) {
		const { contentSize, children } = item;

		// children size
		let bbox = this.computeChildrenBBox(children, 1);

		// node size
		let rankSize = contentSize[0];
		let childSize = bbox[1] + contentSize[1];
		if (bbox[0]) {
			rankSize = Math.max(rankSize, bbox[0] + SPACING_RANK);
			childSize += this.SPACING_CHILD;
		}
//		item.size = [rankSize, childSize]; FIXME neni nutne, az na podtrzeni

		let offset = [SPACING_RANK, contentSize[1]+this.SPACING_CHILD];
		if (rankDirection == "left") { offset[0] = rankSize - bbox[0] - SPACING_RANK; }
		this.layoutChildren(children, rankDirection, offset, bbox);

		// label position
		let labelPos = 0;
		if (rankDirection == "left") { labelPos = rankSize - contentSize[0]; }

		item.contentPosition = [labelPos, 0];
	}

	protected layoutChildren(children, rankDirection, offset, bbox) {
		children.forEach(child => {
			const { size } = child;

			let left = offset[0];
			if (rankDirection == "left") { left += (bbox[0] - size[0]); }

			child.position = [left, offset[1]];

			offset[1] += size[1] + this.SPACING_CHILD; /* offset for next child */
		});
	}

	protected drawLines(item, side) {
		const { contentSize, size, resolvedShape, resolvedColor, children, dom } = item;

		const lineOffset = SPACING_RANK / 2;
		let x1 = (side == "left" ? size[0] - lineOffset : lineOffset) + 0.5;
		this.anchorToggle(item, [x1, contentSize[1]], "bottom");

		dom.connectors.innerHTML = "";

		if (children.length == 0 || item.isCollapsed()) { return; }

		let y1 = resolvedShape.getVerticalAnchor(item);
		let last = children[children.length-1];
		let y2 = last.resolvedShape.getVerticalAnchor(last) + last.position[1];

		let d = [`M ${x1} ${y1} L ${x1} ${y2 - R}`];
		let sweep = (side == "left" ? 1 : 0);

		children.forEach(child => {
			const { resolvedShape, position } = child;
			let y = resolvedShape.getVerticalAnchor(child) + position[1];
			let anchor = this.getChildAnchor(child, side);
			let x2 = (anchor > x1 ? x1+R : x1-R);

			d.push(
				`M ${x1} ${y-R}`,
				`A ${R} ${R} 0 0 ${sweep} ${x2} ${y}`,
				`L ${anchor} ${y}`
			);
		})

		let path = svg.node("path", {d:d.join(" "), stroke:resolvedColor, fill:"none"});
		dom.connectors.append(path);
	}
}

new TreeLayout("tree-left", "Left", "left");
new TreeLayout("tree-right", "Right", "right");
