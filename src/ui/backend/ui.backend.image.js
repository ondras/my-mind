MM.UI.Backend.Image = Object.create(MM.UI.Backend, {
	id: {value: "image"}
});

MM.UI.Backend.Image.save = function() {
	this._backend.save();
}

MM.UI.Backend.Image.load = null;
