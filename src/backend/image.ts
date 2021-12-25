import Backend from "./backend.js";
import * as app from "../my-mind.js";


export type Format = "svg" | "png";

export default class ImageBackend extends Backend {
	constructor() { super("image"); }

	async save(format: Format): Promise<string> {
		const serializer = new XMLSerializer();
		const encoder = new TextEncoder();

		let xmlStr = serializer.serializeToString(app.currentMap.node);
		let encoded = encoder.encode(xmlStr);
		let byteString = [...encoded].map(byte => String.fromCharCode(byte)).join("");
		let base64 = btoa(byteString);
		let svgUrl = `data:image/svg+xml;base64,${base64}`;

		switch (format) {
			case "svg": return svgUrl;

			case "png":
				let img = await waitForImageLoad(svgUrl);
				let canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;
				canvas.getContext("2d")!.drawImage(img, 0, 0);

				return new Promise(resolve => {
					canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), "image/png");
				});
			break;
		}
	}

	download(href: string) {
		let link = document.createElement("a");
		link.download = app.currentMap.name;
		link.href = href;
		link.click();
	}
}

async function waitForImageLoad(src: string): Promise<HTMLImageElement> {
	let img = new Image();
	img.src = src;
	return new Promise(resolve => {
		img.onload = () => resolve(img);
	});
}
