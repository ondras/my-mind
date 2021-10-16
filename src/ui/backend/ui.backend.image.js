MM.UI.Backend.Image = Object.create(MM.UI.Backend, {
	id: {value: "image"}
});

MM.UI.Backend.Image.save = function() {
	var name = MM.App.map.getName();
	var json = MM.App.map.toJSON();
	var data = MM.Format.JSON.to(json);

	this._backend.save(data, name);
}

MM.UI.Backend.Image.load = null;
