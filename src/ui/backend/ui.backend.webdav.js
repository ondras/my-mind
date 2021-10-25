import * as app from "../../my-mind.js";


MM.UI.Backend.WebDAV = Object.create(MM.UI.Backend, {
	id: {value: "webdav"}
});

MM.UI.Backend.WebDAV.init = function(select) {
	MM.UI.Backend.init.call(this, select);

	this._url = this._node.querySelector(".url");
	this._url.value = localStorage.getItem(this._prefix + "url") || "";

	this._current = "";
}

MM.UI.Backend.WebDAV.getState = function() {
	var data = {
		url: this._current
	};
	return data;
}

MM.UI.Backend.WebDAV.setState = function(data) {
	this.load(data.url);
}

MM.UI.Backend.WebDAV.save = async function() {
	app.setThrobber(true);

	var map = app.currentMap;
	var url = this._url.value;
	localStorage.setItem(this._prefix + "url", url);

	if (url.match(/\.mymind$/)) { /* complete file name */
	} else { /* just a path */
		if (url.charAt(url.length-1) != "/") { url += "/"; }
		url += map.name + "." + MM.Format.JSON.extension;
	}

	this._current = url;
	var json = map.toJSON();
	var data = MM.Format.JSON.to(json);

	try {
		await this._backend.save(data, url);
		this._saveDone();
	} catch (e) {
		this._error(e);
	}
}

MM.UI.Backend.WebDAV.load = async function(url = this._url.value) {
	this._current = url;
	app.setThrobber(true);

	var lastIndex = url.lastIndexOf("/");
	this._url.value = url.substring(0, lastIndex);
	localStorage.setItem(this._prefix + "url", this._url.value);

	try {
		let data = await this._backend.load(url);
		this._loadDone(data);
	} catch (e) {
		this._error(e);
	}
}

MM.UI.Backend.WebDAV._loadDone = function(data) {
	try {
		var json = MM.Format.JSON.from(data);
	} catch (e) {
		this._error(e);
	}

	MM.UI.Backend._loadDone.call(this, json);
}
