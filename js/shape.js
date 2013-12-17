MM.Shape = Object.create(MM.Repo, {
	VERTICAL_OFFSET: {value: 0.5},
});

MM.Shape.toJSON = function(data) {
	return this.id;
}

MM.Shape.fromJSON = function(data) {
	return this.getById(data);
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
	item.getDOM().content.style.borderColor = item.getColor();
	return this;
}

MM.Shape.getHorizontalAnchor = function(item) {
	var node = item.getDOM().content;
	return Math.round(node.offsetLeft + node.offsetWidth/2) + 0.5;
}

MM.Shape.getVerticalAnchor = function(item) {
	var node = item.getDOM().content;
	var lines = (item.getText().match(/\n/g) || []).length + 1;
	var line = node.offsetHeight/lines;
	return Math.round(node.offsetTop + node.offsetHeight - (1-this.VERTICAL_OFFSET) * line) + 0.5;
}
