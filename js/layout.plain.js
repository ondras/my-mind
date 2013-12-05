MM.Layout.Plain = Object.create(MM.Layout);
MM.Layout.Plain.childDirection = "right";

MM.Layout.Plain.pick = function(item, direction) {
	if (item.getParent()) { return MM.Layout.pick(item, direction); }

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
