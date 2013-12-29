MM.Backend.GDrive = Object.create(MM.Backend, {
	id: {value: "gdrive"},
	label: {value: "Google Drive"},
	CID: {value: "767837575056-h87qmlhmhb3djhaaqta5gv2v3koa9hii.apps.googleusercontent.com"},
	scope: {value: "https://www.googleapis.com/auth/drive"},
	fileId: {value: null, writable: true}
});

MM.Backend.GDrive.reset = function() {
	/* FIXME zavolat taky nekdy */
	this.fileId = null;
}

MM.Backend.GDrive.save = function(data, name) {
	return this._connect().then(
		function() {
			return this._send(data, name);
		}.bind(this)
	);
}

MM.Backend.GDrive._send = function(data, name) {
	var promise = new Promise();
	var path = "/upload/drive/v2/files";
	var method = "POST";
	if (this.fileId) {
		path += "/" + this.fileId;
		method = "PUT";
	}

	var request = gapi.client.request({
		path: path,
		method: method,
		headers: {
			"Content-Type": "application/json"
		},
		body: data
	});

	request.execute(function(response) {
		if (response) {
			this.fileId = response.id;
			this._sendMetadata(name).then(
				promise.fulfill.bind(promise),
				promise.reject.bind(promise)
			);
		} else {
			promise.reject(new Error("Failed to upload to Google Drive"));
		}
	}.bind(this));
	
	return promise;
}

MM.Backend.GDrive._sendMetadata = function(name) {
	var promise = new Promise();

	var data = {
		title: name
	}

	var request = gapi.client.request({
		path: "/drive/v2/files/" + this.fileId,
		method: "PUT",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(data)
	});

	request.execute(function(response) {
		if (response) {
			promise.fulfill();
		} else {
			promise.reject(new Error("Failed to upload to Google Drive"));
		}
	});
	
	return promise;
}

MM.Backend.GDrive.load = function() {
	this._init().then(
		function() { alert("ok"); },
		function() { alert("fail"); }
	);
	
	return;

	var promise = new Promise();

	this.input.type = "file";

	this.input.onchange = function(e) {
		var file = e.target.files[0];
		if (!file) { return; }

		var index = file.name.lastIndexOf(".");
		if (index > -1) { this.extension = file.name.substring(index+1).toLowerCase(); }

		var reader = new FileReader();
		reader.onload = function() { promise.fulfill(reader.result); }
		reader.onerror = function() { promise.reject(reader.error); }
		reader.readAsText(file);
	}.bind(this);

	this.input.click();
	return promise;
}

MM.Backend.GDrive._connect = function() {
	if (window.gapi && window.gapi.auth.getToken()) {
		return new Promise().fulfill();
	} else {
		return this._load().then(this._auth.bind(this));
	}
}

MM.Backend.GDrive._load = function() {
	/* FIXME jen poprve */
	var promise = new Promise();
	if (window.gapi) { return promise.fulfill(); }
	
	var script = document.createElement("script");
	var name = ("cb"+Math.random()).replace(".", "");
	window[name] = promise.fulfill.bind(promise);
	script.src = "https://apis.google.com/js/client.js?onload=" + name;
	document.body.appendChild(script);

	return promise;
}

MM.Backend.GDrive._auth = function(forceUI) {
	var promise = new Promise();
	var error = new Error("Failed to authorize with Google");

	gapi.auth.authorize({
		"client_id": this.CID,
		"scope": this.scope,
		"immediate": !forceUI
	}, function(token) {
		
		if (token) { /* done */
			promise.fulfill();
		} else if (!forceUI) { /* try again with ui */
			this._auth(true).then(
				promise.fulfill.bind(promise),
				promise.reject.bind(promise)
			);
		} else { /* bad luck */
			promise.reject(error);
		}

	}.bind(this));

	return promise;
}
