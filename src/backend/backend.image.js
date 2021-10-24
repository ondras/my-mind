import * as app from "../my-mind.js";


MM.Backend.Image = Object.create(MM.Backend, {
	id: {value: "image"},
	label: {value: "Image"},
	url: {value:"", writable:true}
});

MM.Backend.Image.save = function() {
	let serializer = new XMLSerializer();
	let xml = serializer.serializeToString(app.currentMap.node);

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
			link.download = app.currentMap.name;
			link.href = URL.createObjectURL(blob);
			link.click();
		}, "image/png");
	}
}
