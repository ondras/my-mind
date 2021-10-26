import BackendUI, { Mode } from "./backend.js";
import * as app from "../../my-mind.js";
import File, { LoadedData } from "../../backend/file.js";


export default class FileUI extends BackendUI<File> {
	constructor() {
		super(new File(), "File");

		const { format } = this;
		format.append(
			MM.Format.JSON.buildOption(),
			MM.Format.FreeMind.buildOption(),
			MM.Format.MMA.buildOption(),
			MM.Format.Mup.buildOption(),
			MM.Format.Plaintext.buildOption()
		)
		format.value = localStorage.getItem(this.prefix + "format") || MM.Format.JSON.id;
	}

	protected get format() { return this.node.querySelector<HTMLSelectElement>(".format"); }

	show(mode: Mode) {
		super.show(mode);

		this.go.textContent = (mode == "save" ? "Save" : "Browse");
	}

	save() {
		let format = MM.Format.getById(this.format.value);
		var json = app.currentMap.toJSON();
		var data = format.to(json);

		var name = app.currentMap.name + "." + format.extension;
		try {
			this.backend.save(data, name);
			this.saveDone();
		} catch (e) {
			this.error(e);
		}
	}

	async load() {
		try {
			let data = await this.backend.load();
			this.loadDone(data);
		} catch (e) {
			this.error(e)
		}
	}

	protected loadDone(data: LoadedData) {
		try {
			let format = MM.Format.getByName(data.name) || MM.Format.JSON;
			let json = format.from(data.data);
			super.loadDone(json);
		} catch (e) {
			this.error(e);
		}
	}

	protected submit() {
		localStorage.setItem(`${this.prefix}.format`, this.format.value);
		super.submit();

	}
}
