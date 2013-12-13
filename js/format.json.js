MM.Format.JSON = Object.create(MM.Format, {
	id: {value: "json"},
	label: {value: "Native (JSON)"},
	extension: {value: "json"}
});
MM.Format.JSON.to = function(data, options) { 
	return JSON.stringify(data, null, 2) + "\n";
}
MM.Format.JSON.from = function(data) {
	return JSON.parse(data);
}
