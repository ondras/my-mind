import Layout from "./layout.js";
import Item from "../item.js";
import * as svg from "../svg.js";


export const SPACING_RANK = 16;
const R = SPACING_RANK/2;

export default class GraphLayout extends Layout {

	update(item: Item) {
		this.layoutItem(item, this.childDirection);

		const { connectors } = item.dom;
		connectors.innerHTML = "";

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

		/* children size */
		var bbox = this.computeChildrenBBox(item.children, childIndex);

		/* node size */
		var rankSize = contentSize[rankIndex];
		if (bbox[rankIndex]) { rankSize += bbox[rankIndex] + SPACING_RANK; }
		var childSize = Math.max(bbox[childIndex], contentSize[childIndex]);

		let size = [rankSize, childSize];
		if (rankIndex == 1) { size = size.reverse(); }
		item.size = size; // FIXME no longer necessary?

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
		let itemAnchor = [
			contentPosition[0] - 0.5,
			resolvedShape.getVerticalAnchor(item)
		];
		if (side == "right") { itemAnchor[0] += contentSize[0] + 1; }

		var y1 = resolvedShape.getVerticalAnchor(item);
		let x1;
		if (side == "left") {
			x1 = contentPosition[0] - 0.5;
		} else {
			x1 = contentPosition[0] + contentSize[0] + 0.5;
		}

		this.anchorToggle(item, itemAnchor[0], itemAnchor[1], side);
		if (item.isCollapsed()) { return; }

		if (children.length == 1) {
			var child = children[0];
			const { position, resolvedShape } = child;

			let childAnchor = [
				this.getChildAnchor(child, side),
				resolvedShape.getVerticalAnchor(child) + position[1]
			];
			let mid = (itemAnchor[0] + childAnchor[0])/2;

			let d = [
				`M ${itemAnchor}`,
				`C ${[mid, itemAnchor[1]]} ${[mid, childAnchor[1]]} ${childAnchor}`
			];
			let path = svg.node("path", {d:d.join(" "), stroke:resolvedColor, fill:"none"});
			dom.connectors.append(path);
			return;
		}

		let x2 = (side == "left" ? x1-R : x1+R);
		let d = [
			`M ${x1} ${y1}`,
			`L ${x2} ${y1}`
		];

		// rounded connectors for first/last child
		var c1 = children[0];
		var c2 = children[children.length-1];
		var x = x2;
		var xx = x + (side == "left" ? -R : R);
		let sweep = (xx < x ? 1 : 0);

		let p1 = c1.position;
		let p2 = c2.position;

		var y1 = c1.resolvedShape.getVerticalAnchor(c1) + p1[1];
		var y2 = c2.resolvedShape.getVerticalAnchor(c2) + p2[1];
		x1 = this.getChildAnchor(c1, side);
		x2 = this.getChildAnchor(c2, side);

		d.push(
			`M ${x1} ${y1}`,
			`L ${xx} ${y1}`,
			`A ${R} ${R} 0 0 ${sweep} ${x} ${y1+R}`,
			`L ${x} ${y2-R}`,
			`A ${R} ${R} 0 0 ${sweep} ${xx} ${y2}`,
			`L ${x2} ${y2}`
		);

		// straight connectors for others
		for (var i=1; i<children.length-1; i++) {
			var c = children[i];
			const { position } = c;
			var y = c.resolvedShape.getVerticalAnchor(c) + position[1];

			d.push(
				`M ${x} ${y}`,
				`L ${this.getChildAnchor(c, side)} ${y}`
			);
		}

		let path = svg.node("path", {d:d.join(" "), stroke:resolvedColor, fill:"none"});
		dom.connectors.append(path);
	}

	protected drawLinesVertical(item, side) {
		const { contentSize, size, resolvedShape, resolvedColor, children, dom } = item;
		if (children.length == 0) { return; }

		// first part from this item
		var x = resolvedShape.getHorizontalAnchor(item);
		var height = (children.length == 1 ? 2*R : R);

		let y1, y2;
		if (side == "top") {
			y1 = size[1] - contentSize[1];
			y2 = y1 - height;
			this.anchorToggle(item, x, y1, side);
		} else {
			y1 = resolvedShape.getVerticalAnchor(item);
			y2 = contentSize[1] + height;
			this.anchorToggle(item, x, contentSize[1], side);
		}

		if (item.isCollapsed()) { return; }

		let d = [
			`M ${x} ${y1}`,
			`L ${x} ${y2}`
		];
		if (children.length == 1) {
			let path = svg.node("path", {d:d.join(" "), stroke:resolvedColor, fill:"none"});
			dom.connectors.append(path);
			return;
		}

		// rounded connectors for first/last child
		var c1 = children[0];
		var c2 = children[children.length-1];
		var offset = contentSize[1] + height;
		var y = Math.round(side == "top" ? size[1] - offset : offset) + 0.5;
		var yy = y + (side == "top" ? -R : R);
		let sweep = (yy > y ? 1 : 0);
		const p1 = c1.position;
		const p2 = c2.position;

		var x1 = c1.resolvedShape.getHorizontalAnchor(c1) + p1[0];
		var x2 = c2.resolvedShape.getHorizontalAnchor(c2) + p2[0];
		y1 = this.getChildAnchor(c1, side);
		y2 = this.getChildAnchor(c2, side);

		d.push(
			`M ${x1} ${y1}`,
			`L ${x1} ${yy}`,
			`A ${R} ${R} 0 0 ${sweep} ${x1+R} ${y}`,
			`L ${x2-R} ${y}`,
			`A ${R} ${R} 0 0 ${sweep} ${x2} ${yy}`,
			`L ${x2} ${y2}`
		);

		for (var i=1; i<children.length-1; i++) {
			var c = children[i];
			const { position, resolvedShape } = c;
			var x = resolvedShape.getHorizontalAnchor(c) + position[0];
			d.push(
				`M ${x} ${y}`,
				`L ${x} ${this.getChildAnchor(c, side)}`
			);
		}

		let path = svg.node("path", {d:d.join(" "), stroke:resolvedColor, fill:"none"});
		dom.connectors.append(path);
	}
}

new GraphLayout("graph-bottom", "Bottom", "bottom");
new GraphLayout("graph-top", "Top", "top");
new GraphLayout("graph-left", "Left", "left");
new GraphLayout("graph-right", "Right", "right");
