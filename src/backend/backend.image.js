MM.Backend.Image = Object.create(MM.Backend, {
	id: {value: "image"},
	label: {value: "Image"},
	url: {value:"", writable:true}
});

MM.Backend.Image.save = function(data, name) {
	var form = document.createElement("form");
	form.action = this.url;
	form.method = "post";
	form.target = "_blank";

	var input = document.createElement("input");
	input.type = "hidden";
	input.name = "data";
	input.value = data;
	form.appendChild(input);

	var input = document.createElement("input");
	input.type = "hidden";
	input.name = "name";
	input.value = name;
	form.appendChild(input);

	document.body.appendChild(form);
	form.submit();
	form.parentNode.removeChild(form);
}
