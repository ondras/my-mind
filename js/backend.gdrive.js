MM.Backend.GDrive = Object.create(MM.Backend, {
	id: {value: "gdrive"},
	label: {value: "Google Drive"},
	CID: {value: "767837575056-h87qmlhmhb3djhaaqta5gv2v3koa9hii.apps.googleusercontent.com"},
	scope: {value: "https://www.googleapis.com/auth/drive"},
	scope: {value: "https://www.googleapis.com/auth/drive"},
});

MM.Backend.GDrive.save = function(data, name) {
	this._init();
	return;
	
	var link = document.createElement("a");
	link.download = name;
	link.href = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(data)));
	document.body.appendChild(link);
	link.click();
	link.parentNode.removeChild(link);

	var promise = new Promise().fulfill();
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

MM.Backend.GDrive._init = function() {
	return this._load().then(this._auth.bind(this));
}

MM.Backend.GDrive._load = function() {
	/* FIXME jen poprve */
	var promise = new Promise();
	
	var script = document.createElement("script");
	var name = ("cb"+Math.random()).replace(".", "");
	window[name] = promise.fulfill.bind(promise);
	script.src = "https://apis.google.com/js/client.js?onload=" + name;
	document.body.appendChild(script);

	return promise;
}

MM.Backend.GDrive._auth = function(forceUI) {
	var promise = new Promise();

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
			promise.reject();
		}

	}.bind(this));

	return promise;
}
