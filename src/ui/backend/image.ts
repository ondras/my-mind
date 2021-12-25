import BackendUI from "./backend.js";
import Image, { Format } from "../../backend/image.js";


export default class ImageUI extends BackendUI<Image> {
	constructor() {
		super(new Image(), "Image");
	}

	protected get format() { return this.node.querySelector<HTMLSelectElement>(".format")!; }

	async save() {
		let url = await this.backend.save(this.format.value as Format);
		this.backend.download(url);
	}

	load() {}
}
