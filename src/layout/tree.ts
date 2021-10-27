import Layout from "./layout.js";
import Item, { TOGGLE_SIZE } from "../item.js";
import * as svg from "../svg.js";


const SPACING_RANK = 32;
const R = SPACING_RANK/4;
const LINE_OFFSET = SPACING_RANK / 2;

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
		if (bbox[0]) {
			rankSize = Math.max(rankSize, bbox[0] + SPACING_RANK);
		}

		let offset = [SPACING_RANK, contentSize[1]+this.SPACING_CHILD];
		if (rankDirection == "left") { offset[0] = rankSize - bbox[0] - SPACING_RANK; }
		this.layoutChildren(children, rankDirection, offset, bbox);

		// label position
		let labelPos = 0;
		if (rankDirection == "left") { labelPos = rankSize - contentSize[0]; }

		item.contentPosition = [labelPos, 0];
	}

	protected layoutChildren(children: Item[], rankDirection, offset, bbox) {
		children.forEach(child => {
			const { size } = child;

			let left = offset[0];
			if (rankDirection == "left") { left += (bbox[0] - size[0]); }

			child.position = [left, offset[1]];

			offset[1] += size[1] + this.SPACING_CHILD; /* offset for next child */
		});
	}

	protected drawLines(item: Item, side) {
		const { size, resolvedShape, resolvedColor, children, dom } = item;

		const lineX = (side == "left" ? size[0] - LINE_OFFSET : LINE_OFFSET) + 0.5;

		let pointAnchor = [
			lineX,
			resolvedShape.getVerticalAnchor(item)
		];
		this.positionToggle(item, [pointAnchor[0], pointAnchor[1] + TOGGLE_SIZE]);

		if (children.length == 0 || item.collapsed) { return; }

		let lastChild = children[children.length-1];
		let lineEnd = [
			lineX,
			lastChild.resolvedShape.getVerticalAnchor(lastChild) + lastChild.position[1] - R
		];
		let d = [`M ${pointAnchor}`, `L ${lineEnd}`];

		let cornerEndX = lineX + (side == "left" ? -R : R);
		let sweep = (cornerEndX < lineX ? 1 : 0);

		children.forEach(child => {
			const { resolvedShape, position } = child;
			const y = resolvedShape.getVerticalAnchor(child) + position[1];

			d.push(
				`M ${lineX} ${y-R}`,
				`A ${R} ${R} 0 0 ${sweep} ${cornerEndX} ${y}`,
				`L ${this.getChildAnchor(child, side)} ${y}`
			);
		})

		let path = svg.node("path", {d:d.join(" "), stroke:resolvedColor, fill:"none"});
		dom.connectors.append(path);
	}
}

new TreeLayout("tree-left", "Left", "left");
new TreeLayout("tree-right", "Right", "right");
