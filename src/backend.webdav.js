MM.Backend.WebDAV = Object.create(MM.Backend, {
	id: {value: "webdav"},
	label: {value: "WebDAV"}
});

MM.Backend.WebDAV.save = function(data, url) {
	return this._request("post", url, data);
}

MM.Backend.WebDAV.load = function(url) {
	return this._request("get", url);
}

MM.Backend.WebDAV._request = function(method, url, data) {
	var xhr = new XMLHttpRequest();
	xhr.open(method, url, true);
	return Promise.send(xhr, data);
}
