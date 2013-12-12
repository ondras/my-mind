MM.UI.IO = function() {
	this._node = document.querySelector("#io");
	this._heading = this._node.querySelector("h3");
	this._backend = new MM.UI.Backend();
}

MM.UI.IO.prototype.show = function(mode) {
	this._node.classList.add("visible");
	this._heading.innerHTML = mode;
}

MM.UI.IO.prototype.hide = function() {
	this._node.classList.remove("visible");
}