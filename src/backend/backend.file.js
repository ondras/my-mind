MM.Backend.File = Object.create(MM.Backend, {
	id: {value: "file"},
	label: {value: "File"},
	input: {value:document.createElement("input")}
});

MM.Backend.File.save = function(data, name) {
	var link = document.createElement("a");
	link.download = name;
	link.href = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(data)));
	document.body.appendChild(link);
	link.click();
	link.parentNode.removeChild(link);

	return Promise.resolve(); // fixme casem async/await, netreba
}

MM.Backend.File.load = function() {
	this.input.type = "file";

	return new Promise((resolve, reject) => {
		this.input.onchange = function(e) {
			var file = e.target.files[0];
			if (!file) { return; }

			var reader = new FileReader();
			reader.onload = function() { resolve({data:reader.result, name:file.name}); }
			reader.onerror = function() { reject(reader.error); }
			reader.readAsText(file);
		}.bind(this);

		this.input.click();
	});
}
