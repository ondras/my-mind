MM.Backend.GDrive = Object.create(MM.Backend, {
	id: {value: "gdrive"},
	label: {value: "Google Drive"},
	scope: {value: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.install"},
	clientId: {value: "767837575056-h87qmlhmhb3djhaaqta5gv2v3koa9hii.apps.googleusercontent.com"},
	apiKey: {value: "AIzaSyCzu1qVxlgufneOYpBgDJXN6Z9SNVcHYWM"},
	fileId: {value: null, writable: true}
});

MM.Backend.GDrive.reset = function() {
	this.fileId = null;
}

MM.Backend.GDrive.save = function(data, name, mime) {
	return this._connect().then(
		function() {
			return this._send(data, name, mime);
		}.bind(this)
	);
}

MM.Backend.GDrive._send = function(data, name, mime) {
	var promise = new Promise();

	var path = "/upload/drive/v2/files";
	var method = "POST";
	if (this.fileId) {
		path += "/" + this.fileId;
		method = "PUT";
	}

	var boundary = "b" + Math.random();
	var delimiter = "--" + boundary;
	var body = [
		delimiter,
		"Content-Type: application/json", "",
		JSON.stringify({title:name}),
		delimiter,
		"Content-Type: " + mime, "",
		data,
		delimiter + "--"
	].join("\r\n");

	var request = gapi.client.request({
		path: path,
		method: method,
		headers: {
			"Content-Type": "multipart/mixed; boundary='" + boundary + "'"
		},
		body: body
	});

	request.execute(function(response) {
		if (!response) {
			promise.reject(new Error("Failed to upload to Google Drive"));
		} else if (response.error) {
			promise.reject(response.error);
		} else {
			this.fileId = response.id;
			promise.fulfill();
		}
	}.bind(this));
	
	return promise;
}

MM.Backend.GDrive.load = function(id) {
	return this._connect().then(
		this._load.bind(this, id)
	);
}

MM.Backend.GDrive._load = function(id) {
	this.fileId = id;

	var promise = new Promise();

	var request = gapi.client.request({
		path: "/drive/v2/files/" + this.fileId,
		method: "GET"
	});

	request.execute(function(response) {
		if (response && response.downloadUrl) {
			var xhr = new XMLHttpRequest();
			xhr.open("get", response.downloadUrl, true);
			xhr.setRequestHeader("Authorization", "Bearer " + gapi.auth.getToken().access_token);
			Promise.send(xhr).then(
				function(xhr) { promise.fulfill({data:xhr.responseText, name:response.title, mime:response.mimeType}); },
				function(xhr) { promise.reject(xhr.responseText); }
			);
		} else {
			promise.reject(response && response.error || new Error("Failed to download file"));
		}
	}.bind(this));

	return promise;
}

MM.Backend.GDrive.pick = function() {
	return this._connect().then(
		this._pick.bind(this)
	);
}

MM.Backend.GDrive._pick = function() {
	var promise = new Promise();

	var token = gapi.auth.getToken();
	var formats = MM.Format.getAll();
	var mimeTypes = ["application/json; charset=UTF-8", "application/json"];
	formats.forEach(function(format) {
		if (format.mime) { mimeTypes.unshift(format.mime); }
	});

	var view = new google.picker.DocsView(google.picker.ViewId.DOCS)
		.setMimeTypes(mimeTypes.join(","))
		.setMode(google.picker.DocsViewMode.LIST);

	var picker = new google.picker.PickerBuilder()
		.enableFeature(google.picker.Feature.NAV_HIDDEN)
		.addView(view)
		.setOAuthToken(token.access_token)
		.setDeveloperKey(this.apiKey)
		.setCallback(function(data) {
			switch (data[google.picker.Response.ACTION]) {
				case google.picker.Action.PICKED:
			 		var doc = data[google.picker.Response.DOCUMENTS][0];
			 		promise.fulfill(doc.id);
				break;

				case google.picker.Action.CANCEL:
					promise.fulfill(null);
				break;
			}
		})
		.build();
	picker.setVisible(true);

	return promise;
}

MM.Backend.GDrive._connect = function() {
	if (window.gapi && window.gapi.auth.getToken()) {
		return new Promise().fulfill();
	} else {
		return this._loadGapi().then(this._auth.bind(this));
	}
}

MM.Backend.GDrive._loadGapi = function() {
	var promise = new Promise();
	if (window.gapi) { return promise.fulfill(); }
	
	var script = document.createElement("script");
	var name = ("cb"+Math.random()).replace(".", "");
	window[name] = promise.fulfill.bind(promise);
	script.src = "https://apis.google.com/js/client:picker.js?onload=" + name;
	document.body.appendChild(script);

	return promise;
}

MM.Backend.GDrive._auth = function(forceUI) {
	var promise = new Promise();

	gapi.auth.authorize({
		"client_id": this.clientId,
		"scope": this.scope,
		"immediate": !forceUI
	}, function(token) {
		if (token && !token.error) { /* done */
			promise.fulfill();
		} else if (!forceUI) { /* try again with ui */
			this._auth(true).then(
				promise.fulfill.bind(promise),
				promise.reject.bind(promise)
			);
		} else { /* bad luck */
			promise.reject(token && token.error || new Error("Failed to authorize with Google"));
		}
	}.bind(this));

	return promise;
}
