import Layout from "./layout.js";
import Item from "../item.js";
import * as svg from "../svg.js";


type Point = [number, number];
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

		let pointAnchor: Point = [
			(side == "left" ? size[0] - LINE_OFFSET : LINE_OFFSET) + 0.5,
			resolvedShape.getVerticalAnchor(item)
		];
		this.anchorToggle(item, pointAnchor, "bottom");

		if (children.length == 0 || item.isCollapsed()) { return; }

		let lastChild = children[children.length-1];
		let lineEnd = [
			pointAnchor[0],
			lastChild.resolvedShape.getVerticalAnchor(lastChild) + lastChild.position[1] - R
		];
		let d = [`M ${pointAnchor}`, `L ${lineEnd}`];

		let cornerEndX = lineEnd[0] + (side == "left" ? -R : R);
		let sweep = (cornerEndX < lineEnd[0] ? 1 : 0);

		children.forEach(child => {
			const { resolvedShape, position } = child;
			const y = resolvedShape.getVerticalAnchor(child) + position[1];

			d.push(
				`M ${pointAnchor[0]} ${y-R}`,
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
