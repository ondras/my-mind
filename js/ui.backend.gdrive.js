MM.UI.Backend.GDrive = Object.create(MM.UI.Backend, {
	id: {value: "gdrive"}
});

MM.UI.Backend.GDrive.save = function() {
	MM.App.ui.setThrobber(true);

	var data = MM.Format.JSON.to(MM.App.map.toJSON());
	var name = MM.App.map.getName() + "." + MM.Format.JSON.extension;
	
	this._backend.save(data, name).then(
		this._saveDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.GDrive.load = function() {
	MM.App.ui.setThrobber(true);

	this._backend.pick().then(
		this._picked.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.GDrive._picked = function(id) {
	MM.App.ui.setThrobber(false);
	if (!id) { return;  }

	MM.App.ui.setThrobber(true);

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
		id: this._backend.fileId
	};
	return data;
}

MM.UI.Backend.GDrive._loadDone = function(data) {
	try {
		var format = MM.Format.JSON;
		var json = format.from(data);
	} catch (e) { 
		this._error(e);
	}

	MM.UI.Backend._loadDone.call(this, json);
}