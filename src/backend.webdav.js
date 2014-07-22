MM.Backend.WebDAV = Object.create(MM.Backend, {
	id: {value: "webdav"},
	label: {value: "Generic WebDAV"}
});

MM.Backend.WebDAV.save = function(data, url) {
	return this._request("put", url, data);
}

MM.Backend.WebDAV.load = function(url) {
	return this._request("get", url);
}

MM.Backend.WebDAV._request = function(method, url, data) {
	var xhr = new XMLHttpRequest();
	xhr.open(method, url, true);
	xhr.withCredentials = true;

	var promise = new Promise();
	
	Promise.send(xhr, data).then(
		function(xhr) { promise.fulfill(xhr.responseText); },
		function(xhr) { promise.reject(new Error("HTTP/" + xhr.status + "\n\n" + xhr.responseText)); }
	);

	return promise;
}
