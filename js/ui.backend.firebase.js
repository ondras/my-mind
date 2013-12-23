MM.UI.Backend.Firebase = Object.create(MM.UI.Backend, {
	id: {value: "firebase"}
});

MM.UI.Backend.Firebase.init = function(select) {
	MM.UI.Backend.init.call(this, select);
	
	this._online = false;
	this._list = this._node.querySelector(".list");
	this._server = this._node.querySelector(".server");
	this._server.value = localStorage.getItem(this._prefix + "server") || "my-mind";
	
	MM.subscribe("firebase-list", this);
}

MM.UI.Backend.Firebase.getState = function() {
	var state = MM.UI.Backend.getState.call(this);
	state.s = this._server.value;
	return state;
}

MM.UI.Backend.Firebase.show = function(mode) {
	MM.UI.Backend.show.call(this, mode);
	this._sync();
}

MM.UI.Backend.Firebase.handleMessage = function(message, publisher, data) {
	switch (message) {
		case "firebase-list":
			this._list.innerHTML = "";
			if (Object.keys(data).length) {
				this._buildList(data);
			} else {
				var o = document.createElement("option");
				o.disabled = true;
				o.innerHTML = "No maps saved";
				this._list.appendChild(o);
			}
			this._sync();
		break;
	}
}

MM.UI.Backend.Firebase._buildList = function(list) {
	for (var id in list) {
		var o = document.createElement("option");
		o.value = id;
		o.innerHTML = list[id];
		this._list.appendChild(o);
	}
}

MM.UI.Backend.Firebase._action = function() {
	if (!this._online) {
		localStorage.setItem(this._prefix + "server", this._server.value);
		this._go.disabled = true;
		this._backend.connect(this._server.value).then(
			this._connected.bind(this),
			this._error.bind(this)
		);
		return;
	}
	
	MM.UI.Backend._action.call(this);
}

MM.UI.Backend.Firebase.save = function() {
	var map = MM.App.map;
	this._backend.save(map.toJSON(), map.getId(), map.getName()).then(
		this._saveDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.Firebase.load = function() {
	this._backend.load(this._list.value).then(
		this._loadDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.Firebase._connected = function() {
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

