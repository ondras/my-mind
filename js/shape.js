MM.Shape = {
	VERTICAL_OFFSET: 0.5
}

MM.Shape.fromJSON = function(data) {
	return MM.Shape[data.type];
}

MM.Shape.toJSON = function() {
	var data = {type:""};
	for (var p in MM.Shape) {
		if (MM.Shape[p] == this) { data.type = p; }
	}
	return data;
}

MM.Shape.set = function(item) {
	return this;
}

MM.Shape.unset = function(item) {
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
