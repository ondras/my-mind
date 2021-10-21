import Layout from "./layout.js";
import Item from "../item.js";
import * as svg from "../svg.js";


type Point = [number, number];
export const SPACING_RANK = 16;
const R = SPACING_RANK/2;

export default class GraphLayout extends Layout {

	update(item: Item) {
		this.layoutItem(item, this.childDirection);

		if (this.childDirection == "left" || this.childDirection == "right") {
			this.drawLinesHorizontal(item, this.childDirection);
		} else {
			this.drawLinesVertical(item, this.childDirection);
		}
	}

	/**
	 * Generic graph child layout routine. Updates item's orthogonal size according to the sum of its children.
	 */
	protected layoutItem(item, rankDirection) {
		var rankIndex = (rankDirection == "left" || rankDirection == "right" ? 0 : 1);
		var childIndex = (rankIndex+1) % 2;

		const { contentSize } = item;

		// children size
		var bbox = this.computeChildrenBBox(item.children, childIndex);

		// node size
		var rankSize = contentSize[rankIndex];
		if (bbox[rankIndex]) { rankSize += bbox[rankIndex] + SPACING_RANK; }
		var childSize = Math.max(bbox[childIndex], contentSize[childIndex]);

		var offset = [0, 0];
		if (rankDirection == "right") { offset[0] = contentSize[0] + SPACING_RANK; }
		if (rankDirection == "bottom") { offset[1] = contentSize[1] + SPACING_RANK; }
		offset[childIndex] = Math.round((childSize - bbox[childIndex])/2);
		this.layoutChildren(item.children, rankDirection, offset, bbox);

		/* label position */
		var labelPos = 0;
		if (rankDirection == "left") { labelPos = rankSize - contentSize[0]; }
		if (rankDirection == "top") { labelPos = rankSize - contentSize[1]; }

		let contentPosition = [Math.round((childSize - contentSize[childIndex])/2), labelPos];
		if (rankIndex == 0) { contentPosition = contentPosition.reverse(); }
		item.contentPosition = contentPosition;
	}

	protected layoutChildren(children, rankDirection, offset, bbox) {
		var rankIndex = (rankDirection == "left" || rankDirection == "right" ? 0 : 1);
		var childIndex = (rankIndex+1) % 2;

		children.forEach(child => {
			const { size } = child;

			if (rankDirection == "left") { offset[0] = bbox[0] - size[0]; }
			if (rankDirection == "top") { offset[1] = bbox[1] - size[1]; }

			child.position = offset;

			offset[childIndex] += size[childIndex] + this.SPACING_CHILD; /* offset for next child */
		});

		return bbox;
	}

	protected drawLinesHorizontal(item: Item, side) {
		const { contentPosition, contentSize, resolvedShape, resolvedColor, children, dom } = item;
		if (children.length == 0) { return; }

		// first part from this item
		let itemAnchor: Point = [
			contentPosition[0] + (side == "right" ? contentSize[0]+0.5 : -0.5),
			resolvedShape.getVerticalAnchor(item)
		];

		this.anchorToggle(item, itemAnchor, side);
		if (item.isCollapsed()) { return; }

		let d: string[] = [];

		if (children.length == 1) {
			var child = children[0];
			const { position, resolvedShape } = child;

			let childAnchor = [
				this.getChildAnchor(child, side),
				resolvedShape.getVerticalAnchor(child) + position[1]
			];
			let mid = (itemAnchor[0] + childAnchor[0])/2;

			d.push(
				`M ${itemAnchor}`,
				`C ${[mid, itemAnchor[1]]} ${[mid, childAnchor[1]]} ${childAnchor}`
			);
			let path = svg.node("path", {d:d.join(" "), stroke:resolvedColor, fill:"none"});
			dom.connectors.append(path);
			return;
		}

		let center = [
			itemAnchor[0] + (side == "left" ? -R : R),
			itemAnchor[1]
		];

		// short line from this item to center
		d.push(`M ${itemAnchor}`, `L ${center}`);

		// rounded connectors for first/last child
		const firstChild = children[0];
		const lastChild = children[children.length-1];
		const cornerEndX = center[0] + (side == "left" ? -R : R);
		const sweep = (cornerEndX < center[0] ? 1 : 0);

		let firstAnchor = [
			this.getChildAnchor(firstChild, side),
			firstChild.resolvedShape.getVerticalAnchor(firstChild) + firstChild.position[1]
		];
		let lastAnchor = [
			this.getChildAnchor(lastChild, side),
			lastChild.resolvedShape.getVerticalAnchor(lastChild) + lastChild.position[1]
		];

		d.push(
			`M ${firstAnchor}`,
			`L ${cornerEndX} ${firstAnchor[1]}`,
			`A ${R} ${R} 0 0 ${sweep} ${center[0]} ${firstAnchor[1]+R}`,
			`L ${center[0]} ${lastAnchor[1]-R}`,
			`A ${R} ${R} 0 0 ${sweep} ${cornerEndX} ${lastAnchor[1]}`,
			`L ${lastAnchor}`
		);

		// straight connectors for others
		for (let i=1; i<children.length-1; i++) {
			const c = children[i];
			const y = c.resolvedShape.getVerticalAnchor(c) + c.position[1];

			let lineStart = [center[0], y];
			let childAnchor = [this.getChildAnchor(c, side), y];

			d.push(`M ${lineStart}`, `L ${childAnchor}`);
		}

		let path = svg.node("path", {d:d.join(" "), stroke:resolvedColor, fill:"none"});
		dom.connectors.append(path);
	}

	protected drawLinesVertical(item, side) {
		const { contentSize, size, resolvedShape, resolvedColor, children, dom } = item;
		if (children.length == 0) { return; }

		const height = (children.length == 1 ? 2*R : R);

		let itemAnchor: Point = [
			resolvedShape.getHorizontalAnchor(item),
			(side == "top" ? size[1] - contentSize[1] : resolvedShape.getVerticalAnchor(item))
		];
		let center = [
			itemAnchor[0],
			(side == "top" ? itemAnchor[1] - height : contentSize[1] + height) + 0.5
		];
		this.anchorToggle(item, itemAnchor, side);

		if (item.isCollapsed()) { return; }

		let d: string[] = [];
		d.push(`M ${itemAnchor}`, `L ${center}`)

		if (children.length == 1) {
			let path = svg.node("path", {d:d.join(" "), stroke:resolvedColor, fill:"none"});
			dom.connectors.append(path);
			return;
		}

		// rounded connectors for first/last child
		const firstChild = children[0];
		const lastChild = children[children.length-1];
		const cornerEndY = center[1] + (side == "top" ? -R : R);
		const sweep = (cornerEndY > center[1] ? 1 : 0);

		let firstAnchor = [
			firstChild.resolvedShape.getHorizontalAnchor(firstChild) + firstChild.position[0],
			this.getChildAnchor(firstChild, side)
		];
		let lastAnchor = [
			lastChild.resolvedShape.getHorizontalAnchor(lastChild) + lastChild.position[0],
			this.getChildAnchor(lastChild, side)
		];

		d.push(
			`M ${firstAnchor}`,
			`L ${firstAnchor[0]} ${cornerEndY}`,
			`A ${R} ${R} 0 0 ${sweep} ${firstAnchor[0]+R} ${center[1]}`,
			`L ${lastAnchor[0]-R} ${center[1]}`,
			`A ${R} ${R} 0 0 ${sweep} ${lastAnchor[0]} ${cornerEndY}`,
			`L ${lastAnchor}`
		);

		for (var i=1; i<children.length-1; i++) {
			const c = children[i];
			const x = c.resolvedShape.getHorizontalAnchor(c) + c.position[0];
			let lineStart = [x, center[1]];
			let childAnchor = [x, this.getChildAnchor(c, side)];
			d.push(`M ${lineStart}`, `L ${childAnchor}`);
		}

		let path = svg.node("path", {d:d.join(" "), stroke:resolvedColor, fill:"none"});
		dom.connectors.append(path);
	}
}

new GraphLayout("graph-bottom", "Bottom", "bottom");
new GraphLayout("graph-top", "Top", "top");
new GraphLayout("graph-left", "Left", "left");
new GraphLayout("graph-right", "Right", "right");
