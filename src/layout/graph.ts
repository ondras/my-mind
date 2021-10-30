import Layout, { Direction } from "./layout.js";
import Item from "../item.js";
import * as svg from "../svg.js";


export const SPACING_RANK = 16;
const R = SPACING_RANK/2;

export default class GraphLayout extends Layout {

	update(item: Item) {
		let totalHeight = this.layoutItem(item, this.childDirection);

		if (this.childDirection == "left" || this.childDirection == "right") {
			this.drawLinesHorizontal(item, this.childDirection);
		} else {
			this.drawLinesVertical(item, this.childDirection, totalHeight);
		}
	}

	/**
	 * Generic graph child layout routine. Updates item's orthogonal size according to the sum of its children.
	 */
	protected layoutItem(item: Item, rankDirection: Direction) {
		const { contentSize, children } = item;

		let rankIndex = (rankDirection == "left" || rankDirection == "right" ? 0 : 1);
		let childIndex = (rankIndex+1) % 2;
		let rankSize = contentSize[rankIndex];
		let childSize = contentSize[childIndex];

		if (!item.collapsed && children.length > 0) {
			// children size
			let bbox = this.computeChildrenBBox(children, childIndex);

			// node size
			rankSize += bbox[rankIndex] + SPACING_RANK;

			childSize = Math.max(childSize, bbox[childIndex]);
			let offset = [0, 0];
			if (rankDirection == "right") { offset[0] = contentSize[0] + SPACING_RANK; }
			if (rankDirection == "bottom") { offset[1] = contentSize[1] + SPACING_RANK; }
			offset[childIndex] = Math.round((childSize - bbox[childIndex])/2);
			this.layoutChildren(children, rankDirection, offset, bbox);

		}

		// content position
		let labelPos = 0;
		if (rankDirection == "left") { labelPos = rankSize - contentSize[0]; }
		if (rankDirection == "top") { labelPos = rankSize - contentSize[1]; }

		let contentPosition = [Math.round((childSize - contentSize[childIndex])/2), labelPos];
		if (rankIndex == 0) { contentPosition = contentPosition.reverse(); }
		item.contentPosition = contentPosition;

		return (rankIndex == 0 ? childSize : rankSize);
	}

	protected layoutChildren(children: Item[], rankDirection: Direction, offset: number[], bbox: number[]) {
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

	protected drawLinesHorizontal(item: Item, side: Direction) {
		const { contentPosition, contentSize, resolvedShape, resolvedColor, children, dom } = item;
		if (children.length == 0) { return; }

		const dirModifier = (side == "right" ? 1 : -1);

		// first part from this item
		let itemAnchor = [
			contentPosition[0] + (side == "right" ? contentSize[0] : 0) + dirModifier*0.5,
			resolvedShape.getVerticalAnchor(item)
		];

		let cross = [
			itemAnchor[0] + dirModifier*R,
			itemAnchor[1]
		];

		this.positionToggle(item, cross);
		if (item.collapsed) { return; }

		let d: string[] = [];

		if (children.length == 1) {
			var child = children[0];
			const { position, resolvedShape } = child;

			let childAnchor = [
				this.getChildAnchor(child, side),
				resolvedShape.getVerticalAnchor(child) + position[1]
			];
			let midX = (itemAnchor[0] + childAnchor[0])/2;

			d.push(
				`M ${itemAnchor}`,
				`C ${[midX, itemAnchor[1]]} ${[midX, childAnchor[1]]} ${childAnchor}`
			);
			let path = svg.node("path", {d:d.join(" "), stroke:resolvedColor, fill:"none"});
			dom.connectors.append(path);
			return;
		}


		// short line from this item to crossroads
		d.push(`M ${itemAnchor}`, `L ${cross}`);

		// rounded connectors for first/last child
		const firstChild = children[0];
		const lastChild = children[children.length-1];
		const cornerEndX = cross[0] + dirModifier*R;
		const sweep = (dirModifier > 0  ? 0 : 1);

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
			`A ${R} ${R} 0 0 ${sweep} ${cross[0]} ${firstAnchor[1]+R}`,
			`L ${cross[0]} ${lastAnchor[1]-R}`,
			`A ${R} ${R} 0 0 ${sweep} ${cornerEndX} ${lastAnchor[1]}`,
			`L ${lastAnchor}`
		);

		// straight connectors for others
		for (let i=1; i<children.length-1; i++) {
			const c = children[i];
			const y = c.resolvedShape.getVerticalAnchor(c) + c.position[1];

			let lineStart = [cross[0], y];
			let childAnchor = [this.getChildAnchor(c, side), y];

			d.push(`M ${lineStart}`, `L ${childAnchor}`);
		}

		let path = svg.node("path", {d:d.join(" "), stroke:resolvedColor, fill:"none"});
		dom.connectors.append(path);
	}

	protected drawLinesVertical(item: Item, side: Direction, totalHeight: number) {
		const { contentSize, resolvedShape, resolvedColor, children, dom } = item;
		if (children.length == 0) { return; }

		const dirModifier = (side == "bottom" ? 1 : -1);

		let itemAnchor = [
			resolvedShape.getHorizontalAnchor(item),
			(side == "bottom" ? resolvedShape.getVerticalAnchor(item) : totalHeight - contentSize[1])
		];
		let cross = [
			itemAnchor[0],
			(side == "bottom" ? contentSize[1] : itemAnchor[1]) + (R*dirModifier + 0.5)
		];

		this.positionToggle(item, cross);

		if (item.collapsed) { return; }

		let d: string[] = [];
		d.push(`M ${itemAnchor}`, `L ${cross}`)

		if (children.length == 1) {
			let child = children[0];
			let childAnchor = [cross[0], this.getChildAnchor(child, side)];
			d.push(`M ${cross}`, `L ${childAnchor}`);

			let path = svg.node("path", {d:d.join(" "), stroke:resolvedColor, fill:"none"});
			dom.connectors.append(path);
			return;
		}

		// rounded connectors for first/last child
		const firstChild = children[0];
		const lastChild = children[children.length-1];
		const cornerEndY = cross[1] + dirModifier*R;
		const sweep = (dirModifier > 0 ? 1 : 0);

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
			`A ${R} ${R} 0 0 ${sweep} ${firstAnchor[0]+R} ${cross[1]}`,
			`L ${lastAnchor[0]-R} ${cross[1]}`,
			`A ${R} ${R} 0 0 ${sweep} ${lastAnchor[0]} ${cornerEndY}`,
			`L ${lastAnchor}`
		);

		for (var i=1; i<children.length-1; i++) {
			const c = children[i];
			const x = c.resolvedShape.getHorizontalAnchor(c) + c.position[0];
			let lineStart = [x, cross[1]];
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
