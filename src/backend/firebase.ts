import Backend from "./backend.js";
import * as pubsub from "../pubsub.js";
import { Jsonified } from "../map.js";


declare const firebase: any;

export default class File extends Backend {
	protected ref;
	protected changeTimeout: ReturnType<typeof setTimeout>;

	protected current = {
		id: null,
		name: null,
		data: null
	}

	constructor() { super("firebase"); }

	connect(server, auth) {
		// fixme move to constants?
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
			pubsub.publish("firebase-list", this, snap.val() || {});
		}, this);

		if (auth) { return this.login(auth); }
	}

	save(data: Jsonified, id: string, name: string) {
		this.ref.child("names/" + id).set(name);

		return new Promise<void>((resolve, reject) => {
			this.ref.child("data/" + id).set(data, result => {
				if (result) {
					reject(result);
				} else {
					resolve();
					this.listenStart(data, id);
				}
			});
		});
	}

	load(id: string) {
		return new Promise<Jsonified>((resolve, reject) => {
			this.ref.child("data/" + id).once("value", snap => {
				var data = snap.val();
				if (data) {
					resolve(data);
					this.listenStart(data, id);
				} else {
					reject(new Error("There is no such saved map"));
				}
			});
		});
	}

	remove(id: string) {
		this.ref.child("names/" + id).remove();

		return new Promise<void>((resolve, reject) => {
			this.ref.child("data/" + id).remove(result => {
				result ? reject(result) : resolve();
			});
		});
	}

	reset() {
		this.listenStop(); /* do not monitor current firebase ref for changes */
	}

	/**
	 * Merge current (remote) data with updated map
	 */
	mergeWith(data, name) {
		var id = this.current.id;

		if (name != this.current.name) {
			this.current.name = name;
			this.ref.child("names/" + id).set(name);
		}


		var dataRef = this.ref.child("data/" + id);
		var oldData = this.current.data;

		this.listenStop();
		this.recursiveRefMerge(dataRef, oldData, data);
		this.listenStart(data, id);
	}

	/**
	 * @param {Firebase} ref
	 * @param {object} oldData
	 * @param {object} newData
	 */
	protected recursiveRefMerge(ref, oldData, newData) {
		var updateObject = {};

		if (newData instanceof Array) { /* merge arrays */

			for (var i=0; i<newData.length; i++) {
				var newValue = newData[i];

				if (!(i in oldData)) { /* new key */
					updateObject[i] = newValue;
				} else if (typeof(newValue) == "object") { /* recurse */
					this.recursiveRefMerge(ref.child(i), oldData[i], newValue);
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
					this.recursiveRefMerge(ref.child(p), oldData[p], newValue);
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

	protected listenStart(data, id) {
		if (this.current.id && this.current.id == id) { return; }

		this.listenStop();
		this.current.id = id;
		this.current.data = data;

		this.ref.child("data/" + id).on("value", this.onValueChange, this);
	}

	protected listenStop() {
		if (!this.current.id) { return; }

		this.ref.child("data/" + this.current.id).off("value");
		this.current.id = null;
		this.current.name = null;
		this.current.data = null;
	}


	/**
	 * Monitored remote ref changed.
	 * FIXME move timeout logic to ui.backend.firebase?
	 */
	protected onValueChange(snap) {
		this.current.data = snap.val();

		clearTimeout(this.changeTimeout);
		this.changeTimeout = setTimeout(() => {
			pubsub.publish("firebase-change", this, this.current.data);
		}, 200);
	}

	protected async login(type) {
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

		let result = await firebase.auth().signInWithPopup(provider);
		return result.user;
	}
}
