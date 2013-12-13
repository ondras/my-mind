MM.Backend.File = Object.create(MM.Backend, {
	id: {value: "file"},
	label: {value: "File"},
	extension: {value:"", writable:true},
	input: {value:document.createElement("input")}
});

MM.Backend.File.save = function(data, name) {
	var link = document.createElement("a");
	link.download = name;
	link.href = "data:text/plain;base64," + btoa(data);
	document.body.appendChild(link);
	link.click();
	link.parentNode.removeChild(link);

	var promise = new Promise().fulfill();
	return promise;
}

MM.Backend.File.load = function(name) {
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
