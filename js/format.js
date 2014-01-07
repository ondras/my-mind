MM.Format = Object.create(MM.Repo, {
	extension: {value:""}
});

MM.Format.getByName = function(name) {
	var index = name.lastIndexOf(".");
	var result = MM.Format.JSON;
	if (index > -1) { 
		var extension = name.substring(index+1).toLowerCase(); 
		var format = this.getByProperty("extension", extension);
		if (format) { result = format; }
	}
	return result;
}

MM.Format.to = function(data) {}
MM.Format.from = function(data) {}
