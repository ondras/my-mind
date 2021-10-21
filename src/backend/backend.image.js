MM.Backend.Image = Object.create(MM.Backend, {
	id: {value: "image"},
	label: {value: "Image"},
	url: {value:"", writable:true}
});

MM.Backend.Image.save = function() {
	let serializer = new XMLSerializer();
	let xml = serializer.serializeToString(MM.App.map._svg);

	let base64 = btoa(xml);
	let img = new Image();
	img.src = `data:image/svg+xml;base64,${base64}`;
	window.img = img;

	img.onload = () => {
		let canvas = document.createElement("canvas");
		window.canvas= canvas;
		canvas.width = img.width;
		canvas.height = img.height;
		canvas.getContext("2d").drawImage(img, 0, 0);

		canvas.toBlob(blob => {
			let link = document.createElement("a");
			link.download = MM.App.map.getName();
			link.href = URL.createObjectURL(blob);
			link.click();
		}, "image/png");
	}
}
