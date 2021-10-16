MM.UI.IO = function() {
	this._prefix = "mm.app.";
	this._mode = "";
	this._node = document.querySelector("#io");
	this._heading = this._node.querySelector("h3");

	this._backend = this._node.querySelector("#backend");
	this._currentBackend = null;
	this._backends = {};
	var ids = ["local", "firebase", "gdrive", "file", "webdav", "image"];
	ids.forEach(function(id) {
		var ui = MM.UI.Backend.getById(id);
		ui.init(this._backend);
		this._backends[id] = ui;
	}, this);

	this._backend.value = localStorage.getItem(this._prefix + "backend") || MM.Backend.File.id;
	this._backend.addEventListener("change", this);
	
	MM.subscribe("map-new", this);
	MM.subscribe("save-done", this);
	MM.subscribe("load-done", this);
}

MM.UI.IO.prototype.restore = function() {
	var parts = {};
	location.search.substring(1).split("&").forEach(function(item) {
		var keyvalue = item.split("=");
		parts[decodeURIComponent(keyvalue[0])] = decodeURIComponent(keyvalue[1]);
	});
	
	/* backwards compatibility */
	if ("map" in parts) { parts.url = parts.map; }

	/* just URL means webdav backend */
	if ("url" in parts && !("b" in parts)) { parts.b = "webdav"; }

	var backend = MM.UI.Backend.getById(parts.b);
	if (backend) { /* saved backend info */
		backend.setState(parts); 
		return;
	}

	if (parts.state) { /* opened from gdrive */
		try {
			var state = JSON.parse(parts.state);
			if (state.action == "open") {
				state = {
					b: "gdrive",
					id: state.ids[0]
				};
				MM.UI.Backend.GDrive.setState(state);
			} else {
				history.replaceState(null, "", ".");
			}
			return;
		} catch (e) { }
	}
}

MM.UI.IO.prototype.handleMessage = function(message, publisher) {
	switch (message) {
		case "map-new":
			this._setCurrentBackend(null);
		break;
		
		case "save-done":
		case "load-done":
			this.hide();
			this._setCurrentBackend(publisher);
		break;
	}
}

MM.UI.IO.prototype.show = function(mode) {
	this._mode = mode;
	this._node.classList.add("visible");
	this._heading.innerHTML = mode;
	
	this._syncBackend();
	window.addEventListener("keydown", this);
}

MM.UI.IO.prototype.hide = function() {
	if (!this._node.classList.contains("visible")) { return; }
	this._node.classList.remove("visible");
	MM.Clipboard.focus();
	window.removeEventListener("keydown", this);
}

MM.UI.IO.prototype.quickSave = function() {
	if (this._currentBackend) { 
		this._currentBackend.save();
	} else {
		this.show("save");
	}
}

MM.UI.IO.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "keydown":
			if (e.keyCode == 27) { this.hide(); }
		break;
		
		case "change":
			this._syncBackend();
		break;
	}
}

MM.UI.IO.prototype._syncBackend = function() {
	var all = this._node.querySelectorAll("div[id]");
	[].slice.apply(all).forEach(function(node) { node.style.display = "none"; });
	
	this._node.querySelector("#" + this._backend.value).style.display = "";
	
	this._backends[this._backend.value].show(this._mode);
}

/**
 * @param {MM.UI.Backend} backend
 */
MM.UI.IO.prototype._setCurrentBackend = function(backend) {
	if (this._currentBackend && this._currentBackend != backend) { this._currentBackend.reset(); }
	
	if (backend) { localStorage.setItem(this._prefix + "backend", backend.id); }
	this._currentBackend = backend;
	try {
		this._updateURL(); /* fails when on file:/// */
	} catch (e) {}
}

MM.UI.IO.prototype._updateURL = function() {
	var data = this._currentBackend && this._currentBackend.getState();
	if (!data) {
		history.replaceState(null, "", ".");
	} else {
		var arr = Object.keys(data).map(function(key) {
			return encodeURIComponent(key)+"="+encodeURIComponent(data[key]);
		});
		history.replaceState(null, "", "?" + arr.join("&"));
	}
}
