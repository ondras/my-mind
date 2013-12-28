MM.UI.Backend.GDrive = Object.create(MM.UI.Backend, {
	id: {value: "gdrive"}
});

MM.UI.Backend.GDrive.init = function(select) {
	MM.UI.Backend.init.call(this, select);
	
//	this._list = this._node.querySelector(".list");
}

MM.UI.Backend.GDrive.save = function() {
	var json = MM.App.map.toJSON();
	var data = MM.Format.JSON.to(json);

	try {
		this._backend.save(data, MM.App.map.getName());
		this._saveDone();
	} catch (e) {
		this._error(e);
	}
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
