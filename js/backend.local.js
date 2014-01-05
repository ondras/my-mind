MM.Backend.Local = Object.create(MM.Backend, {
	label: {value: "Browser storage"},
	id: {value: "local"},
	prefix: {value: "mm.map."}
});

MM.Backend.Local.save = function(data, id, name) {
	localStorage.setItem(this.prefix + id, data);

	var names = this.list();
	names[id] = name;
	localStorage.setItem(this.prefix + "names", JSON.stringify(names));
}

MM.Backend.Local.load = function(id) {
	var data = localStorage.getItem(this.prefix + id);
	if (!data) { throw new Error("There is no such saved map"); }
	return data;
}

MM.Backend.Local.remove = function(id) {
	localStorage.removeItem(this.prefix + id);

	var names = this.list();
	delete names[id];
	localStorage.setItem(this.prefix + "names", JSON.stringify(names));
}

MM.Backend.Local.list = function() {
	try {
		var data = localStorage.getItem(this.prefix + "names") || "{}";
		return JSON.parse(data);
	} catch (e) {
		return {};
	}
}
