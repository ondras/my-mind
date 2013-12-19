MM.UI.IO = function() {
	this._prefix = "mm.app.";
	this._mode = "";
	this._node = document.querySelector("#io");
	this._heading = this._node.querySelector("h3");

	this._backend = this._node.querySelector("#backend");
	this._backends = {};
	var ids = ["local", "file"];
	ids.forEach(function(id) {
		var ui = MM.UI.Backend.getById(id);
		ui.init(this._backend);
		this._backends[id] = ui;
	}, this);

	this._backend.value = localStorage.getItem(this._prefix + "backend") || MM.Backend.File.id;
	this._backend.addEventListener("change", this);
}

MM.UI.IO.prototype.show = function(mode) {
	this._mode = mode;
	this._node.classList.add("visible");
	this._heading.innerHTML = mode;
	
	this._syncBackend();
}

MM.UI.IO.prototype.hide = function() {
	this._node.classList.remove("visible");
	document.activeElement.blur();
}

MM.UI.IO.prototype.handleEvent = function(e) {
	localStorage.setItem(this._prefix + "backend", this._backend.value);
	this._syncBackend();
}

MM.UI.IO.prototype._syncBackend = function() {
	var all = this._node.querySelectorAll("div[id]");
	[].concat.apply([], all).forEach(function(node) { node.style.display = "none"; });
	
	var visible = this._node.querySelector("#" + this._backend.value);
	visible.style.display = "";
	
	this._backends[this._backend.value].show(this._mode);
}

