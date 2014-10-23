MM.Format = Object.create(MM.Repo, {
	extension: {value:""},
	mime: {value:""}
});

MM.Format.getByName = function(name) {
	var index = name.lastIndexOf(".");
	if (index == -1) { return null; }
	var extension = name.substring(index+1).toLowerCase(); 
	return this.getByProperty("extension", extension);
}

MM.Format.getByMime = function(mime) {
	return this.getByProperty("mime", mime);
}

MM.Format.to = function(data) {}
MM.Format.from = function(data) {}

MM.Format.nl2br = function(str) {
	return str.replace(/\n/g, "<br/>");
}

MM.Format.br2nl = function(str) {
	return str.replace(/<br\s*\/?>/g, "\n");
}
