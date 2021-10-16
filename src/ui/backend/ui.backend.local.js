MM.UI.Backend.Local = Object.create(MM.UI.Backend, {
	id: {value: "local"}
});

MM.UI.Backend.Local.init = function(select) {
	MM.UI.Backend.init.call(this, select);
	
	this._list = this._node.querySelector(".list");
	this._remove = this._node.querySelector(".remove");
	this._remove.addEventListener("click", this);
}

MM.UI.Backend.Local.handleEvent = function(e) {
	MM.UI.Backend.handleEvent.call(this, e);

	switch (e.target) {
		case this._remove:
			var id = this._list.value;
			if (!id) { break; } 
			this._backend.remove(id);
			this.show(this._mode);
		break;
	}
}

MM.UI.Backend.Local.show = function(mode) {
	MM.UI.Backend.show.call(this, mode);
	
	this._go.disabled = false;

	if (mode == "load") { 
		var list = this._backend.list();
		this._list.innerHTML = "";
		if (Object.keys(list).length) {
			this._go.disabled = false;
			this._remove.disabled = false;
			this._buildList(list, this._list);
		} else {
			this._go.disabled = true;
			this._remove.disabled = true;
			var o = document.createElement("option");
			o.innerHTML = "(no maps saved)";
			this._list.appendChild(o);
		}
	}
}

MM.UI.Backend.Local.setState = function(data) {
	this._load(data.id);
}

MM.UI.Backend.Local.getState = function() {
	var data = {
		b: this.id,
		id: MM.App.map.getId()
	};
	return data;
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
		this._loadDone(json);
	} catch (e) {
		this._error(e);
	}
}
