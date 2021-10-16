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
	// Initialize Firebase
	var config = {
		apiKey: "AIzaSyBO_6uCK8pHjoz1c9htVwZi6Skpm8o4LtQ",
		authDomain: "my-mind.firebaseapp.com",
		databaseURL: "https://" + server + ".firebaseio.com",
		projectId: "firebase-my-mind",
		storageBucket: "firebase-my-mind.appspot.com",
		messagingSenderId: "666556281676"
	};
	firebase.initializeApp(config);

	this.ref = firebase.database().ref();
	
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
MM.Backend.Firebase.mergeWith = function(data, name) {
	var id = this._current.id;

	if (name != this._current.name) {
		this._current.name = name;
		this.ref.child("names/" + id).set(name);
	}


	var dataRef = this.ref.child("data/" + id);
	var oldData = this._current.data;

	this._listenStop();
	this._recursiveRefMerge(dataRef, oldData, data);
	this._listenStart(data, id);
}

/**
 * @param {Firebase} ref
 * @param {object} oldData
 * @param {object} newData
 */
MM.Backend.Firebase._recursiveRefMerge = function(ref, oldData, newData) {
	var updateObject = {};

	if (newData instanceof Array) { /* merge arrays */

		for (var i=0; i<newData.length; i++) {
			var newValue = newData[i];

			if (!(i in oldData)) { /* new key */
				updateObject[i] = newValue;
			} else if (typeof(newValue) == "object") { /* recurse */
				this._recursiveRefMerge(ref.child(i), oldData[i], newValue);
			} else if (newValue !== oldData[i]) { /* changed key */
				updateObject[i] = newValue;
			}
		}

		for (var i=newData.length; i<oldData.length; i++) { updateObject[i] = null; } /* removed array items */

	} else { /* merge objects */

		for (var p in newData) { /* new/changed keys */
			var newValue = newData[p];

			if (!(p in oldData)) { /* new key */
				updateObject[p] = newValue;
			} else if (typeof(newValue) == "object") { /* recurse */
				this._recursiveRefMerge(ref.child(p), oldData[p], newValue);
			} else if (newValue !== oldData[p]) { /* changed key */
				updateObject[p] = newValue;
			}

		}

		for (var p in oldData) { /* removed keys */
			if (!(p in newData)) { updateObject[p] = null; }
		}

	}

	if (Object.keys(updateObject).length) { ref.update(updateObject); }
}

MM.Backend.Firebase._listenStart = function(data, id) {
	if (this._current.id && this._current.id == id) { return; }

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
 * Monitored remote ref changed.
 * FIXME move timeout logic to ui.backend.firebase?
 */
MM.Backend.Firebase._valueChange = function(snap) {
	this._current.data = snap.val();
	if (this._changeTimeout) { clearTimeout(this._changeTimeout); }
	this._changeTimeout = setTimeout(function() {
		MM.publish("firebase-change", this, this._current.data);
	}.bind(this), 200);
}

MM.Backend.Firebase._login = function(type) {
	var provider;
	switch (type) {
		case "github":
			provider = new firebase.auth.GithubAuthProvider();
		break;
		case "facebook":
			provider = new firebase.auth.FacebookAuthProvider();
		break;
		case "twitter":
			provider = new firebase.auth.TwitterAuthProvider();
		break;
		case "google":
			provider = new firebase.auth.GoogleAuthProvider();
		break;
	}

	return firebase.auth().signInWithPopup(provider).then(function(result) {
		return result.user;
	});
}
