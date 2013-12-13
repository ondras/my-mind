MM.UI.IO = function() {
	this._mode = "";
	this._node = document.querySelector("#io");
	this._heading = this._node.querySelector("h3");
	this._name = document.querySelector("#name");
	this._backend = document.querySelector("#backend");
	this._format = document.querySelector("#format");
	this._go = document.querySelector("#go");
	this._close = document.querySelector("#close");

	this._backend.appendChild(MM.Backend.Local.buildOption());
	this._backend.appendChild(MM.Backend.File.buildOption());
	this._backend.value = localStorage.getItem("mm.app.backend") || MM.Backend.File.id;

	this._format.appendChild(MM.Format.JSON.buildOption());
	this._format.value = localStorage.getItem("mm.app.format") || MM.Format.JSON.id;

	this._go.addEventListener("click", this);
	this._close.addEventListener("click", this);
	this._backend.addEventListener("change", this);
	this._format.addEventListener("change", this);
}

MM.UI.IO.prototype.show = function(mode) {
	this._mode = mode;
	this._node.classList.add("visible");
	this._heading.innerHTML = mode;

	var p = this._format.parentNode;
	p.style.display = (mode == "save" ? "" : "none");
	this._syncBackend();
}

MM.UI.IO.prototype.hide = function() {
	this._node.classList.remove("visible");
}

MM.UI.IO.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "click":
			switch (e.target) {
				case this._go:
					this._goClick();
				break;

				case this._close:
					this.hide();
				break;
			}
		break;

		case "change":
			this._syncBackend();
		break;
	}
}

MM.UI.IO.prototype._goClick = function() {
	var backend = this._getBackend();
	switch (this._mode) {
		case "load":
			backend.load().then(this._loadDone.bind(this), this._error.bind(this));
		break;

		case "save":
			var format = this._getFormat();
			var json = MM.App.map.toJSON();
			var data = format.to(json);

			var name = this._name.value;
			if (backend.id == "file") { name += "." + format.extension; }
			backend.save(data, name).then(this._saveDone.bind(this), this._error.bind(this));
		break;
	}
}

MM.UI.IO.prototype._syncBackend = function() {
	var all = this._node.querySelectorAll("[data-for]");
	for (var i=0;i<all.length;i++) { all[i].style.display = "none"; }

	var id = this._getBackend().id + "-" + this._mode;
	var current = this._node.querySelectorAll("[data-for~=" + id + "]");
	for (var i=0;i<current.length;i++) { current[i].style.display = ""; }
}

MM.UI.IO.prototype._addItem = function(select, label, value) {
	var option = document.createElement("option");
	option.value = value;
	option.innerHTML = label;
	select.appendChild(option);
}

MM.UI.IO.prototype._getBackend = function() {
	return MM.Backend.getById(this._backend.value);
}

MM.UI.IO.prototype._getFormat = function() {
	return MM.Format.getById(this._format.value);
}

MM.UI.IO.prototype._loadDone = function(data) {
	try {
		var format = MM.Format.JSON;

		var backend = this._getBackend();
		if (backend.id == "file" && backend.extension) {
			format = MM.Format.getByProperty("extension", backend.extension);
		}

		var json = format.from(data);
		var map = MM.Map.fromJSON(json);
		MM.App.setMap(map);
		this.hide();

	} catch (e) { 
		this._error(e);
	}
}

MM.UI.IO.prototype._saveDone = function() {
	this.hide();
}

MM.UI.IO.prototype._error = function(e) {
	alert(e.message);
}
