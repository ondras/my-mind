import BackendUI from "./backend.js";
import GDrive from "../../backend/gdrive.js";
import * as app from "../../my-mind.js";


export default class GDriveUI extends BackendUI<GDrive> {
	constructor() {
		super(new GDrive(), "Google Drive");

		const { format } = this;

		let options = [
			MM.Format.JSON,
			MM.Format.FreeMind,
			MM.Format.MMA,
			MM.Format.Mup,
			MM.Format.Plaintext
		].map(f => f.buildOption());
		format.append(...options);

		format.value = localStorage.getItem(`${this.prefix}.format`) || MM.Format.JSON.id;
	}

	get format() { return this.node.querySelector<HTMLSelectElement>(".format"); }

	async save() {
		app.setThrobber(true);

		var format = MM.Format.getById(this.format.value);
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
			var format = MM.Format.getByMime(data.mime) || MM.Format.getByName(data.name) || MM.Format.JSON;
			var json = format.from(data.data);
		} catch (e) {
			this.error(e);
		}

		super.loadDone(json);
	}
}
