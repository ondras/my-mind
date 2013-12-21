MM.Backend.Local = Object.create(MM.Backend, {
	label: {value: "Browser storage"},
	id: {value: "local"},
	prefix: {value: "mm.map."}
});

MM.Backend.Local.save = function(data, name) {
	localStorage.setItem(this.prefix + name, data);
}

MM.Backend.Local.load = function(name) {
	return localStorage.getItem(this.prefix + name);
}

MM.Backend.Local.list = function() {
	var count = localStorage.length;
	var names = [];
	var re = new RegExp("^" + this.prefix + "(.*)");
	for (var i=0;i<count;i++) {
		var key = localStorage.key(i);
		var r = key.match(re);
		if (r) { names.push(r[1]); }
	}

	return names;
}
