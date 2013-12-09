MM.Shape.Ellipse = Object.create(MM.Shape);
MM.Shape.Ellipse.set = function(item) {
	item.getDOM().node.classList.add("shape-ellipse");
}
MM.Shape.Ellipse.unset = function(item) {
	item.getDOM().node.classList.remove("shape-ellipse");
}
