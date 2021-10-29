import Backend from "./backend.js";
import * as app from "../my-mind.js";


export type Format = "svg" | "png";

export default class ImageBackend extends Backend {
	constructor() { super("image"); }

	save(format: Format) {
		const serializer = new XMLSerializer();
		const encoder = new TextEncoder();

		let xmlStr = serializer.serializeToString(app.currentMap.node);
		let encoded = encoder.encode(xmlStr);
		let byteString = [...encoded].map(byte => String.fromCharCode(byte)).join("");
		let base64 = btoa(byteString);
		let svgUrl = `data:image/svg+xml;base64,${base64}`;

		if (format == "svg") {
			this.download(svgUrl);
		} else if (format == "png") {
			let img = new Image();
			img.src = svgUrl;

			img.onload = () => {
				let canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;
				canvas.getContext("2d")!.drawImage(img, 0, 0);

				canvas.toBlob(blob => {
					this.download(URL.createObjectURL(blob));
				}, "image/png");
			}
		}
	}

	protected download(href: string) {
		let link = document.createElement("a");
		link.download = app.currentMap.name;
		link.href = href;
		link.click();
	}
}
