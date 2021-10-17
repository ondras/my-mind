MM.Shape = Object.create(MM.Repo, {
	VERTICAL_OFFSET: {value: 0.5},
});

MM.Shape.set = function(item) {
	item.dom.node.classList.add("shape-"+this.id);
	return this;
}

MM.Shape.unset = function(item) {
	item.dom.node.classList.remove("shape-"+this.id);
	return this;
}

MM.Shape.update = function(item) {
	item.dom.content.style.borderColor = item.getColor();
	return this;
}

MM.Shape.getHorizontalAnchor = function(item) {
	var node = item.dom.content;
	return Math.round(node.offsetLeft + node.offsetWidth/2) + 0.5;
}

MM.Shape.getVerticalAnchor = function(item) {
	var node = item.dom.content;
	return node.offsetTop + Math.round(node.offsetHeight * this.VERTICAL_OFFSET) + 0.5;
}
