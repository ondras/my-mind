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

	return new Promise((resolve, reject) => {
		request.execute(response => {
			if (!response) {
				reject(new Error("Failed to upload to Google Drive"));
			} else if (response.error) {
				reject(response.error);
			} else {
				this.fileId = response.id;
				resolve();
			}
		});
	});
}

MM.Backend.GDrive.load = function(id) {
	return this._connect().then(
		this._load.bind(this, id)
	);
}

MM.Backend.GDrive._load = function(id) {
	this.fileId = id;

	var request = gapi.client.request({
		path: "/drive/v2/files/" + this.fileId,
		method: "GET"
	});

	return new Promise((resolve, reject) => {
		request.execute(async response => {
			if (!response || !response.id) {
				return reject(response && response.error || new Error("Failed to download file"));
			}

			let headers = {"Authentication": "Bearer " + gapi.auth.getToken().access_token};

			let r = await fetch(`https://www.googleapis.com/drive/v2/files/${response.id}?alt=media`, {headers});
			let data = await r.text();
			if (r.status != 200) { return reject(data); }

			resolve({data, name:response.title, mime:response.mimeType});
		});
	});
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

MM.Backend.GDrive._auth = async function(forceUI) {
	return new Promise((resolve, reject) => {
		gapi.auth.authorize({
			"client_id": this.clientId,
			"scope": this.scope,
			"immediate": !forceUI
		}, async token => {
			if (token && !token.error) { // done
				resolve();
			} else if (!forceUI) { // try again with ui
				try {
					await this._auth(true);
					resolve();
				} catch (e) { reject(e); }
			} else { // bad luck
				reject(token && token.error || new Error("Failed to authorize with Google"));
			}
		});
	});
}
