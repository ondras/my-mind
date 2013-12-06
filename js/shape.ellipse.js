MM.Shape.Ellipse = Object.create(MM.Shape.Box);
MM.Shape.Ellipse.update = function(item) {
	MM.Shape.Box.update(item);
	var content = item.getDOM().content;
	content.style.borderRadius = "50%";
	content.style.padding = "0.5em 1em";
}
