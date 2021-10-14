MM.UI.FontColor = function() {
	this._node = document.querySelector("#fontColor");
	this._node.addEventListener("click", this);

	var items = this._node.querySelectorAll("[data-color]");
	
	for (var i=0;i<items.length;i++) {
		var item = items[i];
		item.style.backgroundColor = item.getAttribute("data-color");
	}
}

MM.UI.FontColor.prototype.handleEvent = function(e) {
	e.preventDefault();
	if (!e.target.hasAttribute("data-color")) { return; }
	
	var color = e.target.getAttribute("data-color") || null;
	var action = new MM.Action.SetFontColor(MM.App.current, color);
	MM.App.action(action);
}
