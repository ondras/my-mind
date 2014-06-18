MM.Backend.Firebase = Object.create(MM.Backend, {
	label: {value: "Firebase"},
	id: {value: "firebase"},
	ref: {value:null, writable:true},
	listenRef: {value:null, writable:true}
});

MM.Backend.Firebase.connect = function(server, auth) {
	this.ref = new Firebase("https://" + server + ".firebaseio.com/");
	
	this.ref.child("names").on("value", function(snap) {
		MM.publish("firebase-list", this, snap.val() || {});
	});

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
		var ref = this.ref.child("data/" + id);
		ref.set(data, function(result) {
			if (result) {
				promise.reject(result);
			} else {
				promise.fulfill();
				this._listenStart(ref);
			}
		}.bind(this));
	} catch (e) {
		promise.reject(e);
	}
	return promise;
}

MM.Backend.Firebase.load = function(id) {
	var promise = new Promise();
	
	var ref = this.ref.child("data/" + id);
	ref.once("value", function(snap) {
		var data = snap.val();
		if (data) {
			promise.fulfill(data);
			this._listenStart(ref);
		} else {
			promise.reject(new Error("There is no such saved map"));
		}
	}.bind(this));
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

MM.Backend.Firebase._listenStart = function(ref) {
	if (this.listenRef && this.listenRef.toString() == ref.toString()) { return; }

	this._listenStop();
	this.listenRef = ref;
	ref.on("value", function() { /* console.log("!"); */ });
}

MM.Backend.Firebase._listenStop = function() {
	if (this.listenRef) { 
		this.listenRef.off("value");
		this.listenRef = null;
	}
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
