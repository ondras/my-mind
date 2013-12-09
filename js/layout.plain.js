MM.Layout.Plain = Object.create(MM.Layout);
MM.Layout.Plain.getChildDirection = function() {
	return "right";
}

MM.Layout.Plain.pick = function(item, direction) {
	if (item.getParent()) { return MM.Layout.pick.call(this, item, direction); }

	switch (direction) {
		case "left": 
			return item; 
		break;
		case "right": 
		case "bottom": 
			return (item.getChildren().length ? item.getChildren()[0] : item);
		break;
		case "top":
			return (item.getChildren().length ? item.getChildren()[item.getChildren().length-1] : item);
		break;
	}
}

MM.Layout.Plain.set = function(item) {
	item.getDOM().node.classList.add("layout-plain");
}

MM.Layout.Plain.unset = function(item) {
	item.getDOM().node.classList.remove("layout-plain");
}
