MM.Backend.WebDAV = Object.create(MM.Backend, {
	id: {value: "webdav"},
	label: {value: "Generic WebDAV"}
});

MM.Backend.WebDAV.save = function(data, url) {
	return this._request("PUT", url, data);
}

MM.Backend.WebDAV.load = function(url) {
	return this._request("GET", url);
}

MM.Backend.WebDAV._request = async function(method, url, data) {
	let init = {
		method,
		credentials: "include"
	}
	if (data) { init.body = data; }

	let response = await fetch(url, init);
	let text = await response.text();

	if (response.status == 200) {
		return text;
	} else {
		throw new Error("HTTP/" + response.status + "\n\n" + text);
	}
}
