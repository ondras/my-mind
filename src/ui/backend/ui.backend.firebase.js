import * as pubsub from "../../pubsub.js";
import * as app from "../../my-mind.js";


MM.UI.Backend.Firebase = Object.create(MM.UI.Backend, {
	id: {value: "firebase"}
});

MM.UI.Backend.Firebase.init = function(select) {
	MM.UI.Backend.init.call(this, select);

	this._online = false;
	this._itemChangeTimeout = null;
	this._list = this._node.querySelector(".list");
	this._server = this._node.querySelector(".server");
	this._server.value = localStorage.getItem(this._prefix + "server") || "my-mind";

	this._auth = this._node.querySelector(".auth");
	this._auth.value = localStorage.getItem(this._prefix + "auth") || "";

	this._remove = this._node.querySelector(".remove");
	this._remove.addEventListener("click", this);

	this._go.disabled = false;
	pubsub.subscribe("firebase-list", this);
	pubsub.subscribe("firebase-change", this);
}

MM.UI.Backend.Firebase.setState = function(data) {
	this._connect(data.s, data.a).then(
		this._load.bind(this, data.id),
		this._error.bind(this)
	);
}

MM.UI.Backend.Firebase.getState = function() {
	var data = {
		id: app.currentMap.id,
		b: this.id,
		s: this._server.value
	};
	if (this._auth.value) { data.a = this._auth.value; }
	return data;
}

MM.UI.Backend.Firebase.show = function(mode) {
	MM.UI.Backend.show.call(this, mode);
	this._sync();
}

MM.UI.Backend.Firebase.handleEvent = function(e) {
	MM.UI.Backend.handleEvent.call(this, e);

	switch (e.target) {
		case this._remove:
			var id = this._list.value;
			if (!id) { break; }
			app.setThrobber(true);
			this._backend.remove(id).then(
				function() { app.setThrobber(false); },
				this._error.bind(this)
			);
		break;
	}
}

MM.UI.Backend.Firebase.handleMessage = function(message, publisher, data) {
	switch (message) {
		case "firebase-list":
			this._list.innerHTML = "";
			if (Object.keys(data).length) {
				this._buildList(data, this._list);
			} else {
				var o = document.createElement("option");
				o.innerHTML = "(no maps saved)";
				this._list.appendChild(o);
			}
			this._sync();
		break;

		case "firebase-change":
			if (data) {
				pubsub.unsubscribe("item-change", this);
				app.currentMap.mergeWith(data);
				pubsub.subscribe("item-change", this);
			} else { /* FIXME */
				console.log("remote data disappeared");
			}
		break;

		case "item-change":
			if (this._itemChangeTimeout) { clearTimeout(this._itemChangeTimeout); }
			this._itemChangeTimeout = setTimeout(this._itemChange.bind(this), 200);
		break;
	}
}

MM.UI.Backend.Firebase.reset = function() {
	this._backend.reset();
	pubsub.unsubscribe("item-change", this);
}

MM.UI.Backend.Firebase._itemChange = function() {
	var map = app.currentMap;
	this._backend.mergeWith(map.toJSON(), map.name);
}

MM.UI.Backend.Firebase._action = function() {
	if (!this._online) {
		this._connect(this._server.value, this._auth.value);
		return;
	}

	MM.UI.Backend._action.call(this);
}

MM.UI.Backend.Firebase.save = function() {
	app.setThrobber(true);

	var map = app.currentMap;
	this._backend.save(map.toJSON(), map.id, map.name).then(
		this._saveDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.Firebase.load = function() {
	this._load(this._list.value);
}

MM.UI.Backend.Firebase._load = function(id) {
	app.setThrobber(true);
	/* FIXME posere se kdyz zmenim jeden firebase na jiny, mozna */
	this._backend.load(id).then(
		this._loadDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.Firebase._connect = async function(server, auth) {
	var promise = new Promise();

	this._server.value = server;
	this._auth.value = auth;
	this._server.disabled = true;
	this._auth.disabled = true;

	localStorage.setItem(this._prefix + "server", server);
	localStorage.setItem(this._prefix + "auth", auth || "");

	this._go.disabled = true;
	app.setThrobber(true);

	await this._backend.connect(server, auth);
	this._connected();
}

MM.UI.Backend.Firebase._connected = function() {
	app.setThrobber(false);
	this._online = true;
	this._sync();
}

MM.UI.Backend.Firebase._sync = function() {
	if (!this._online) {
		this._go.innerHTML = "Connect";
		return;
	}

	this._go.disabled = false;
	if (this._mode == "load" && !this._list.value) { this._go.disabled = true; }
	this._go.innerHTML = this._mode.charAt(0).toUpperCase() + this._mode.substring(1);
}

MM.UI.Backend.Firebase._loadDone = function() {
	pubsub.subscribe("item-change", this);
	MM.UI.Backend._loadDone.apply(this, arguments);
}

MM.UI.Backend.Firebase._saveDone = function() {
	pubsub.subscribe("item-change", this);
	MM.UI.Backend._saveDone.apply(this, arguments);
}
