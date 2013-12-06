MM.Format.JSON = Object.create(MM.Format);
MM.Format.JSON.name = "JSON";
MM.Format.JSON.to = function(data, options) { 
	return JSON.stringify(data, null, 2); 
}
MM.Format.JSON.from = function(data) {
	return JSON.parse(data);
}
