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
		if (Object.keys(list).length) {
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

MM.UI.Backend.Local.setState = function(data) {
	this._load(data.id);
}

MM.UI.Backend.Local.getState = function() {
	var data = {
		id: MM.App.map.getId()
	};
	return data;
}

MM.UI.Backend.Local._buildList = function(list) {
	for (var id in list) {
		var o = document.createElement("option");
		o.value = id;
		o.innerHTML = list[id];
		this._list.appendChild(o);
	}
}

MM.UI.Backend.Local.save = function() {
	var json = MM.App.map.toJSON();
	var data = MM.Format.JSON.to(json);

	try {
		this._backend.save(data, MM.App.map.getId(), MM.App.map.getName());
		this._saveDone();
	} catch (e) {
		this._error(e);
	}
}

MM.UI.Backend.Local.load = function() {
	this._load(this._list.value);
}

MM.UI.Backend.Local._load = function(id) {
	try {
		var data = this._backend.load(id);
		var json = MM.Format.JSON.from(data);
	} catch (e) {
		this._error(e);
	}
	this._loadDone(json);
}
