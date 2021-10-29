import BackendUI from "./backend.js";
import { repo as formatRepo, getByMime, getByName } from "../../format/format.js";
import GDrive from "../../backend/gdrive.js";
import * as app from "../../my-mind.js";
import { fill as fillFormats } from "../format-select.js";


interface State {
	id: string;
	b: string;
}

export default class GDriveUI extends BackendUI<GDrive> {
	constructor() {
		super(new GDrive(), "Google Drive");

		fillFormats(this.format);
		this.format.value = localStorage.getItem(`${this.prefix}.format`) || "native";
	}

	get format() { return this.node.querySelector<HTMLSelectElement>(".format")!; }

	async save() {
		app.setThrobber(true);

		let format = formatRepo.get(this.format.value)!;
		let json = app.currentMap.toJSON();
		let data = format.to(json);
		let name = app.currentMap.name;
		let mime = "text/plain";

		if (format.mime) {
			mime = format.mime;
		} else {
			name += "." + format.extension;
		}

		try {
			await this.backend.save(data, name, mime);
			this.saveDone();
		} catch (e) {
			this.error(e);
		}
	}

	async load() {
		app.setThrobber(true);

		try {
			let id = await this.backend.pick();
			this.picked(id);
		} catch (e) {
			this.error(e);
		}
	}

	protected async picked(id: string | null) {
		app.setThrobber(false);
		if (!id) { return;  }

		app.setThrobber(true);

		try {
			let data = await this.backend.load(id);
			let format = getByMime(data.mime) || getByName(data.name) || formatRepo.get("native");
			let json = format.from(data.data);
			this.loadDone(json);
		} catch (e) {
			this.error(e);
		}
	}

	setState(data: State) {
		this.picked(data.id);
	}

	getState() {
		let data: State = {
			b: this.id,
			id: this.backend.fileId!
		};
		return data;
	}
}
