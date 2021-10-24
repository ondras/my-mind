import * as app from "../../my-mind.js";


MM.UI.Backend.GDrive = Object.create(MM.UI.Backend, {
	id: {value: "gdrive"}
});

MM.UI.Backend.GDrive.init = function(select) {
	MM.UI.Backend.init.call(this, select);

	this._format = this._node.querySelector(".format");
	this._format.appendChild(MM.Format.JSON.buildOption());
	this._format.appendChild(MM.Format.FreeMind.buildOption());
	this._format.appendChild(MM.Format.MMA.buildOption());
	this._format.appendChild(MM.Format.Mup.buildOption());
	this._format.appendChild(MM.Format.Plaintext.buildOption());
	this._format.value = localStorage.getItem(this._prefix + "format") || MM.Format.JSON.id;
}

MM.UI.Backend.GDrive.save = function() {
	app.setThrobber(true);

	var format = MM.Format.getById(this._format.value);
	var json = app.currentMap.toJSON();
	var data = format.to(json);
	var name = app.currentMap.name;
	var mime = "text/plain";

	if (format.mime) {
		mime = format.mime;
	} else {
		name += "." + format.extension;
	}

	this._backend.save(data, name, mime).then(
		this._saveDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.GDrive.load = function() {
	app.setThrobber(true);

	this._backend.pick().then(
		this._picked.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.GDrive._picked = function(id) {
	app.setThrobber(false);
	if (!id) { return;  }

	app.setThrobber(true);

	this._backend.load(id).then(
		this._loadDone.bind(this),
		this._error.bind(this)
	)
}

MM.UI.Backend.GDrive.setState = function(data) {
	this._picked(data.id);
}

MM.UI.Backend.GDrive.getState = function() {
	var data = {
		b: this.id,
		id: this._backend.fileId
	};
	return data;
}

MM.UI.Backend.GDrive._loadDone = function(data) {
	try {
		var format = MM.Format.getByMime(data.mime) || MM.Format.getByName(data.name) || MM.Format.JSON;
		var json = format.from(data.data);
	} catch (e) {
		this._error(e);
	}

	MM.UI.Backend._loadDone.call(this, json);
}
