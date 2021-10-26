import BackendUI from "./backend.js";
import Image from "../../backend/image.js";


export default class ImageUI extends BackendUI<Image> {
	constructor() {
		super(new Image(), "Image");
	}

	save() { this.backend.save(); }

	load() {}
}
