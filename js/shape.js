MM.Shape = {
	ALL: [],
	VERTICAL_OFFSET: 0.5,
	id: ""
}

MM.Shape.toJSON = function(data) {
	return this.id;
}

MM.Shape.fromJSON = function(data) {
	return this.ALL.filter(function(item) {
		return (item.id == data);
	})[0] || null;
}

MM.Shape.set = function(item) {
	item.getDOM().node.classList.add("shape-"+this.id);
	return this;
}

MM.Shape.unset = function(item) {
	item.getDOM().node.classList.remove("shape-"+this.id);
	return this;
}

MM.Shape.update = function(item) {
	return this;
}

MM.Shape.updateCanvas = function(item) {

}

MM.Shape.getHorizontalAnchor = function(item) {
	var node = item.getDOM().content;
	return Math.round(node.offsetLeft + node.offsetWidth/2) + 0.5;
}

MM.Shape.getVerticalAnchor = function(item) {
	var node = item.getDOM().content;
	return Math.round(this.VERTICAL_OFFSET * node.offsetHeight + node.offsetTop) + 0.5;
}
