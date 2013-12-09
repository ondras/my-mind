MM.Shape.Box = Object.create(MM.Shape);
MM.Shape.Box.set = function(item) {
	item.getDOM().node.classList.add("shape-box");
}
MM.Shape.Box.unset = function(item) {
	item.getDOM().node.classList.remove("shape-box");
}
