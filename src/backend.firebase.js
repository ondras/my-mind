MM.Backend.Firebase = Object.create(MM.Backend, {
	label: {value: "Firebase"},
	id: {value: "firebase"},
	ref: {value:null, writable:true},
	_current: {value: {
		id: null,
		name: null,
		data: null
	}}
});

MM.Backend.Firebase.connect = function(server, auth) {
	this.ref = new Firebase("https://" + server + ".firebaseio.com/");
	
	this.ref.child("names").on("value", function(snap) {
		MM.publish("firebase-list", this, snap.val() || {});
	}, this);

	if (auth) {
		return this._login(auth);
	} else {
		return new Promise().fulfill();
	}
}

MM.Backend.Firebase.save = function(data, id, name) {
	var promise = new Promise();

	try {
		this.ref.child("names/" + id).set(name);
		this.ref.child("data/" + id).set(data, function(result) {
			if (result) {
				promise.reject(result);
			} else {
				promise.fulfill();
				this._listenStart(data, id);
			}
		}.bind(this));
	} catch (e) {
		promise.reject(e);
	}
	return promise;
}

MM.Backend.Firebase.load = function(id) {
	var promise = new Promise();
	
	this.ref.child("data/" + id).once("value", function(snap) {
		var data = snap.val();
		if (data) {
			promise.fulfill(data);
			this._listenStart(data, id);
		} else {
			promise.reject(new Error("There is no such saved map"));
		}
	}, this);
	return promise;
}

MM.Backend.Firebase.remove = function(id) {
	var promise = new Promise();

	try {
		this.ref.child("names/" + id).remove();
		this.ref.child("data/" + id).remove(function(result) {
			if (result) {
				promise.reject(result);
			} else {
				promise.fulfill();
			}
		});
	} catch (e) {
		promise.reject(e);
	}

	return promise;
}

MM.Backend.Firebase.reset = function() {
	this._listenStop(); /* do not monitor current firebase ref for changes */
}

/**
 * Merge current (remote) data with updated map
 */
MM.Backend.Firebase.mergeWidth = function(data, name) {
	if (name != this._current.name) {
		this._current.name = name;
		this.ref.child("names/" + this._current.id).set(name);
	}

	var dataRef = this.ref.child("data/" + this._current.id);
	this._recursiveRefMerge(dataRef, this._current.data, data);
}

MM.Backend.Firebase._recursiveRefMerge = function(ref, oldData, newData) {
	/* FIXME */
}

MM.Backend.Firebase._listenStart = function(data, id) {
	if (this._current.id && this.current.id == id) { return; }

	this._listenStop();
	this._current.id = id;
	this._current.data = data;

	this.ref.child("data/" + id).on("value", this._valueChange, this);
}

MM.Backend.Firebase._listenStop = function() {
	if (!this._current.id) { return; }

	this.ref.child("data/" + this._current.id).off("value");
	this._current.id = null;
	this._current.name = null;
	this._current.data = null;
}


/**
 * Monitored remote ref changed
 * FIXME use timeout to buffer changes?
 */
MM.Backend.Firebase._valueChange = function(snap) {
	this._current.data = snap.val();
	MM.publish("firebase-change", this, this._current.data);
}

MM.Backend.Firebase._login = function(type) {
	var promise = new Promise();

	var auth = new FirebaseSimpleLogin(this.ref, function(error, user) {
		if (error) {
			promise.reject(error);
		} else if (user) {
			promise.fulfill(user);
		}
	});
	auth.login(type);

	return promise;
}
