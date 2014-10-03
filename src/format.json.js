MM.Format.JSON = Object.create(MM.Format, {
	id: {value: "json"},
	label: {value: "Native (JSON)"},
	extension: {value: "mymind"},
	mime: {value: "application/vnd.mymind+json"}
});

MM.Format.JSON.to = function(data) { 
	return JSON.stringify(data, null, "\t") + "\n";
}

MM.Format.JSON.from = function(data) {
	return JSON.parse(data);
}
