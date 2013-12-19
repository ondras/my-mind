MM.UI.Backend.File = Object.create(MM.UI.Backend, {
	id: {value: "file"}
});

MM.UI.Backend.File.init = function(select) {
	MM.UI.Backend.init.call(this, select);
	
	this._format = this._node.querySelector(".format");
	this._format.appendChild(MM.Format.JSON.buildOption());
	this._format.appendChild(MM.Format.FreeMind.buildOption());
	this._format.appendChild(MM.Format.MMA.buildOption());
	this._format.value = localStorage.getItem(this._prefix + "format") || MM.Format.JSON.id;
	this._format.addEventListener("change", this);
	
	this._name = this._node.querySelector(".name");

	MM.subscribe("map-change", this);
}

MM.UI.Backend.File.show = function(mode) {
	MM.UI.Backend.show.call(this, mode);
	
	this._go.innerHTML = (mode == "save" ? "Save" : "Browse");
	if (!this._name.value && mode == "save") { this._name.value = MM.App.map.getRoot().getText(); }
}

MM.UI.Backend.File.handleMessage = function(message, publisher) {
	switch (message) {
		case "map-change":
			this._name.value = "";
		break;
	}
}

MM.UI.Backend.File._action = function() {
	localStorage.setItem(this._prefix + "format", this._format.value);

	switch (this._mode) {
		case "save":
			var format = MM.Format.getById(this._format.value);
			var json = MM.App.map.toJSON();
			var data = format.to(json);

			var name = this._name.value + "." + format.extension;
			this._backend.save(data, name).then(
				this._saveDone.bind(this),
				this._error.bind(this)
			);
		break;
		
		case "load":
			this._backend.load().then(
				this._loadDone.bind(this),
				this._error.bind(this)
			);
		break;
	}
}


MM.UI.Backend.File._saveDone = function() {
	this.hide(); /* FIXME */
}

MM.UI.Backend.File._loadDone = function(data) {
	try {
		var format = MM.Format.JSON;

		if (this._backend.extension) {
			format = MM.Format.getByProperty("extension", this._backend.extension);
		}

		var json = format.from(data);
		var map = MM.Map.fromJSON(json);
		MM.App.setMap(map);
		this.hide(); /* FIXME */

	} catch (e) { 
		this._error(e);
	}
}
