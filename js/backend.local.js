MM.Backend.Local = Object.create(MM.Backend);
MM.Backend.Local.name = "Browser storage";
MM.Backend.Local._prefix = "mm-";

MM.Backend.Local.save = function(data, name, options) {
	var promise = new Promise();

	try {
		localStorage.setItem(this._prefix + name, data);
		promise.fulfill("OK");
	} catch (e) {
		promise.reject(e);
	}
	return promise;
}

MM.Backend.Local.load = function(name, options) {
	var promise = new Promise();

	try {
		var data = localStorage.getItem(this._prefix + name);
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
		var re = new RegExp("^" + this._prefix + "(.*)");
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
