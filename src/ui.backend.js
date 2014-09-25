MM.UI.Backend = Object.create(MM.Repo);

MM.UI.Backend.init = function(select) {
	this._backend = MM.Backend.getById(this.id);
	this._mode = "";
	this._prefix = "mm.app." + this.id + ".";

	this._node = document.querySelector("#" + this.id);
	
	this._cancel = this._node.querySelector(".cancel");
	this._cancel.addEventListener("click", this);

	this._go = this._node.querySelector(".go");
	this._go.addEventListener("click", this);
	
	select.appendChild(this._backend.buildOption());
}

MM.UI.Backend.reset = function() {
	this._backend.reset();
}

MM.UI.Backend.setState = function(data) {
}

MM.UI.Backend.getState = function() {
	return null;
}

MM.UI.Backend.handleEvent = function(e) {
	switch (e.target) {
		case this._cancel:
			MM.App.io.hide();
		break;

		case this._go:
			this._action();
		break;
	}
}

MM.UI.Backend.save = function() {
}

MM.UI.Backend.load = function() {
}

MM.UI.Backend.show = function(mode) {
	this._mode = mode;

	this._go.innerHTML = mode.charAt(0).toUpperCase() + mode.substring(1);

	var all = this._node.querySelectorAll("[data-for]");
	[].concat.apply([], all).forEach(function(node) { node.style.display = "none"; });

	var visible = this._node.querySelectorAll("[data-for~=" + mode + "]");
	[].concat.apply([], visible).forEach(function(node) { node.style.display = ""; });

	/* switch to 2a: steal focus from the current item */
	this._go.focus();
}

MM.UI.Backend._action = function() {
	switch (this._mode) {
		case "save":
			this.save();
		break;
		
		case "load":
			this.load();
		break;
	}
}

MM.UI.Backend._saveDone = function() {
	MM.App.setThrobber(false);
	MM.publish("save-done", this);
}

MM.UI.Backend._loadDone = function(json) {
	MM.App.setThrobber(false);
	try {
		MM.App.setMap(MM.Map.fromJSON(json));
		MM.publish("load-done", this);
	} catch (e) { 
		this._error(e);
	}
}

MM.UI.Backend._error = function(e) {
	MM.App.setThrobber(false);
	alert("IO error: " + e.message);
}

MM.UI.Backend._buildList = function(list, select) {
	var data = [];
	
	for (var id in list) {
		data.push({id:id, name:list[id]});
	}
	
	data.sort(function(a, b) {
		return a.name.localeCompare(b.name);
	});
	
	data.forEach(function(item) {
		var o = document.createElement("option");
		o.value = item.id;
		o.innerHTML = item.name;
		select.appendChild(o);
	});
}
