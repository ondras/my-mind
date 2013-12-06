MM.Shape.Box = Object.create(MM.Shape);
MM.Shape.Box.update = function(item) {
	var content = item.getDOM().content;
	content.style.border = "1px solid #666";
	content.style.borderRadius = "3px";
	content.style.backgroundColor = "#fff";
}
