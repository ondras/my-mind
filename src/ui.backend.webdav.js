MM.UI.Backend.WebDAV = Object.create(MM.UI.Backend, {
	id: {value: "webdav"}
});

MM.UI.Backend.WebDAV.init = function(select) {
	MM.UI.Backend.init.call(this, select);

	this._url = this._node.querySelector(".url");
	this._url.value = localStorage.getItem(this._prefix + "url") || "";
}

MM.UI.Backend.WebDAV._action = function() {
	localStorage.setItem(this._prefix + "url", this._url.value);
	
	MM.UI.Backend._action.call(this);
}

MM.UI.Backend.WebDAV.save = function() {
	MM.App.setThrobber(true);

	var map = MM.App.map;
	var url = this._url.value;
	if (url.charCodeAt(url.length-1) != "/") { url += "/"; }
	url += map.getName() + MM.Format.JSON.extension;

	this._backend.save(map.toJSON(), url).then(
		this._saveDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.WebDAV.load = function() {
	MM.App.setThrobber(true);

	this._backend.load().then(
		this._loadDone.bind(this),
		this._error.bind(this)
	);
}

MM.UI.Backend.File._loadDone = function(xhr) {
	try {
		var json = MM.Format.JSON.from(xhr.responseText);
	} catch (e) { 
		this._error(e);
	}

	MM.UI.Backend._loadDone.call(this, json);
}
