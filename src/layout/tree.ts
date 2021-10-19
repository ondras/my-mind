import Layout from "./layout.js";
import Item from "../item.js";


export default class TreeLayout extends Layout {
	protected SPACING_RANK = 32;

	update(item: Item) {
		this.layoutItem(item, this.childDirection);
		this.drawLines(item, this.childDirection);
	}

	/**
	 * Generic graph child layout routine. Updates item's orthogonal size according to the sum of its children.
	 */
	protected layoutItem(item, rankDirection) {
		const { contentSize } = item;

		/* children size */
		var bbox = this.computeChildrenBBox(item.children, 1);

		/* node size */
		var rankSize = contentSize[0];
		var childSize = bbox[1] + contentSize[1];
		if (bbox[0]) {
			rankSize = Math.max(rankSize, bbox[0] + this.SPACING_RANK);
			childSize += this.SPACING_CHILD;
		}
		item.size = [rankSize, childSize];

		var offset = [this.SPACING_RANK, contentSize[1]+this.SPACING_CHILD];
		if (rankDirection == "left") { offset[0] = rankSize - bbox[0] - this.SPACING_RANK; }
		this.layoutChildren(item.children, rankDirection, offset, bbox);

		/* label position */
		var labelPos = 0;
		if (rankDirection == "left") { labelPos = rankSize - contentSize[0]; }

		item.contentPosition = [labelPos, 0];
	}

	protected layoutChildren(children, rankDirection, offset, bbox) {
		children.forEach(child => {
			const { size } = child;

			var left = offset[0];
			if (rankDirection == "left") { left += (bbox[0] - size[0]); }

			child.position = [left, offset[1]];

			offset[1] += size[1] + this.SPACING_CHILD; /* offset for next child */
		});

		return bbox;
	}

	protected drawLines(item, side) {
		const { contentSize, size, ctx, resolvedShape } = item;

		var R = this.SPACING_RANK/4;
		// FIXME canvas.width nahradit za item.size[0] ?
		var x = (side == "left" ? size[0] - 2*R : 2*R) + 0.5;
		this.anchorToggle(item, x, contentSize[1], "bottom");

		var children = item.children;
		if (children.length == 0 || item.isCollapsed()) { return; }

		ctx.strokeStyle = item.resolvedColor;

		var y1 = resolvedShape.getVerticalAnchor(item);
		var last = children[children.length-1];
		var y2 = last.resolvedShape.getVerticalAnchor(last) + last.position[1];

		ctx.beginPath();
		ctx.moveTo(x, y1);
		ctx.lineTo(x, y2 - R);

		/* rounded connectors */
		for (var i=0; i<children.length; i++) {
			var c = children[i];
			var y = c.resolvedShape.getVerticalAnchor(c) + c.position[1];
			var anchor = this.getChildAnchor(c, side);

			ctx.moveTo(x, y - R);
			ctx.arcTo(x, y, anchor, y, R);
			ctx.lineTo(anchor, y);
		}
		ctx.stroke();
	}
}

new TreeLayout("tree-left", "Left", "left");
new TreeLayout("tree-right", "Right", "right");
