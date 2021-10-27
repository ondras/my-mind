import BackendUI, { repo as buiRepo } from "./backend.js";
import { repo as formatRepo, getByMime, getByName } from "../../format/format.js";
import GDrive from "../../backend/gdrive.js";
import * as app from "../../my-mind.js";
import { fill as fillFormats } from "../format-select.js";


export default class GDriveUI extends BackendUI<GDrive> {
	constructor() {
		super(new GDrive(), "Google Drive");

		fillFormats(this.format);
		this.format.value = localStorage.getItem(`${this.prefix}.format`) || "native";
	}

	get format() { return this.node.querySelector<HTMLSelectElement>(".format"); }

	async save() {
		app.setThrobber(true);

		var format = formatRepo.get(this.format.value);
		var json = app.currentMap.toJSON();
		var data = format.to(json);
		var name = app.currentMap.name;
		var mime = "text/plain";

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
			let id = await this.backend.pick()
			this.picked(id);
		} catch (e) {
			this.error(e);
		}
	}

	protected async picked(id) {
		app.setThrobber(false);
		if (!id) { return;  }

		app.setThrobber(true);

		try {
			let data = await this.backend.load(id);
			this.loadDone(data);
		} catch (e) {
			this.error(e);
		}
	}

	setState(data) {
		this.picked(data.id);
	}

	getState() {
		var data = {
			b: this.id,
			id: this.backend.fileId
		};
		return data;
	}

	protected loadDone(data) {
		try {
			var format = getByMime(data.mime) || getByName(data.name) || formatRepo.get("native");
			var json = format.from(data.data);
		} catch (e) {
			this.error(e);
		}

		super.loadDone(json);
	}
}
