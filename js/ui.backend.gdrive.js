MM.UI.Backend.GDrive = Object.create(MM.UI.Backend, {
	id: {value: "gdrive"}
});

MM.UI.Backend.GDrive.save = function() {
	var json = MM.App.map.toJSON();
	var data = MM.Format.JSON.to(json);
	
	this._backend.save(data, MM.App.map.getName()).then(
		this._saveDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.GDrive.load = function() {
	try {
		this._backend.load();
		return;
		var json = MM.Format.JSON.from(data);
	} catch (e) {
		this._error(e);
	}
	this._loadDone(json);
}
