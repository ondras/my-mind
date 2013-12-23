MM.UI.Backend.Local = Object.create(MM.UI.Backend, {
	id: {value: "local"}
});

MM.UI.Backend.Local.init = function(select) {
	MM.UI.Backend.init.call(this, select);
	
	this._list = this._node.querySelector(".list");
}

MM.UI.Backend.Local.show = function(mode) {
	MM.UI.Backend.show.call(this, mode);
	
	this._go.disabled = false;

	if (mode == "load") { 
		var list = this._backend.list();
		this._list.innerHTML = "";
		if (list.length) {
			this._go.disabled = false;
			this._buildList(list);
		} else {
			this._go.disabled = true;
			var o = document.createElement("option");
			o.disabled = true;
			o.innerHTML = "No maps saved";
			this._list.appendChild(o);
		}
	}
}

MM.UI.Backend.Local._buildList = function(list) {
	list.forEach(function(name) {
		var o = document.createElement("option");
		o.value = o.innerHTML = name;
		this._list.appendChild(o);
	}, this);
}

MM.UI.Backend.Local.save = function() {
	var json = MM.App.map.toJSON();
	var data = MM.Format.JSON.to(json);

	try {
		this._backend.save(data, MM.App.map.getName());
		this._saveDone();
	} catch (e) {
		this._error(e);
	}
}

MM.UI.Backend.Local.load = function() {
	try {
		var data = this._backend.load(this._list.value);
		var json = MM.Format.JSON.from(data);
	} catch (e) {
		this._error(e);
	}
	this._loadDone(json);
}
