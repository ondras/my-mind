import BackendUI from "./backend.js";
import Image, { Format } from "../../backend/image.js";


export default class ImageUI extends BackendUI<Image> {
	constructor() {
		super(new Image(), "Image");
	}

	protected get format() { return this.node.querySelector<HTMLSelectElement>(".format")!; }

	save() { this.backend.save(this.format.value as Format); }

	load() {}
}
