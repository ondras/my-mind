MM.UI.Backend.GDrive = Object.create(MM.UI.Backend, {
	id: {value: "gdrive"}
});

MM.UI.Backend.GDrive.save = function() {
	var data = MM.Format.JSON.to(MM.App.map.toJSON());
	var name = MM.App.map.getName() + "." + MM.Format.JSON.extension;
	
	this._backend.save(data, name).then(
		this._saveDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.GDrive.load = function() {
	this._backend.load().then(
		this.loadDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.GDrive.getState = function() {
	var data = {
		b: this._backend.id,
		id: this._backend.fileId
	};
	return data;
}
