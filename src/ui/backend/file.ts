import BackendUI, { Mode } from "./backend.js";
import * as app from "../../my-mind.js";
import File from "../../backend/file.js";
import { repo as formatRepo, getByName } from "../../format/format.js";
import { fill as fillFormats } from "../format-select.js";


export default class FileUI extends BackendUI<File> {
	constructor() {
		super(new File(), "File");

		fillFormats(this.format);
		this.format.value = localStorage.getItem(this.prefix + "format") || "native";
	}

	protected get format() { return this.node.querySelector<HTMLSelectElement>(".format")!; }

	show(mode: Mode) {
		super.show(mode);

		this.go.textContent = (mode == "save" ? "Save" : "Browse");
	}

	save() {
		let format = formatRepo.get(this.format.value)!;
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
			let format = getByName(data.name) || formatRepo.get("native")!;
			let json = format.from(data.data);
			this.loadDone(json);
		} catch (e) {
			this.error(e);
		}
	}

	protected submit() {
		localStorage.setItem(`${this.prefix}.format`, this.format.value);
		super.submit();

	}
}
