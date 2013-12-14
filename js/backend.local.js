MM.Backend.Local = Object.create(MM.Backend, {
	label: {value: "Browser storage"},
	id: {value: "local"},
	prefix: {value: "mm.map."}
});

MM.Backend.Local.save = function(data, name) {
	var promise = new Promise();

	try {
		localStorage.setItem(this.prefix + name, data);
		promise.fulfill();
	} catch (e) {
		promise.reject(e);
	}
	return promise;
}

MM.Backend.Local.load = function(name) {
	var promise = new Promise();

	try {
		var data = localStorage.getItem(this.prefix + name);
		if (data) {
			promise.fulfill(data);
		} else {
			promise.reject("Not found");
		}
	} catch (e) {
		promise.reject(e);
	}
	return promise;
}

MM.Backend.Local.list = function() {
	var promise = new Promise();

	try {
		var count = localStorage.length;
		var names = [];
		var re = new RegExp("^" + this.prefix + "(.*)");
		for (var i=0;i<count;i++) {
			var key = localStorage.key(i);
			var r = key.match(re);
			if (r) { names.push(r[1]); }
		}
		promise.fulfill(names);
	} catch (e) {
		promise.reject(e);
	}

	return promise;
}
