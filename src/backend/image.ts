import Backend from "./backend.js";
import * as app from "../my-mind.js";


export default class ImageBackend extends Backend {
	constructor() { super("image"); }

	save() {
		let serializer = new XMLSerializer();
		let xml = serializer.serializeToString(app.currentMap.node);

		let base64 = btoa(xml);
		let img = new Image();
		img.src = `data:image/svg+xml;base64,${base64}`;

		img.onload = () => {
			let canvas = document.createElement("canvas");
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
}
