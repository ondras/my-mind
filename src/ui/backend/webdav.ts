import BackendUI from "./backend.js";
import WebDAV from "../../backend/webdav.js";
import * as app from "../../my-mind.js";


interface State {
	url: string;
}

export default class WebDAVUI extends BackendUI<WebDAV> {
	protected current = "";

	constructor() {
		super(new WebDAV(), "Generic WebDAV");

		this.url.value = localStorage.getItem(`${this.prefix}.url`) || "";
	}

	get url() { return this.node.querySelector<HTMLInputElement>(".url"); }

	getState(): State {
		let data = { url: this.current };
		return data;
	}

	setState(data: State) {
		this.load(data.url);
	}

	async save() {
		app.setThrobber(true);

		var map = app.currentMap;
		var url = this.url.value;
		localStorage.setItem(`${this.prefix}.url`, url);

		if (url.match(/\.mymind$/)) { // complete file name
		} else { // just a path
			if (url.charAt(url.length-1) != "/") { url += "/"; }
			url += `${map.name}.${MM.Format.JSON.extension}`;
		}

		this.current = url;
		let json = map.toJSON();
		let data = MM.Format.JSON.to(json);

		try {
			await this.backend.save(data, url);
			this.saveDone();
		} catch (e) {
			this.error(e);
		}
	}

	async load(url = this.url.value) {
		this.current = url;
		app.setThrobber(true);

		var lastIndex = url.lastIndexOf("/");
		this.url.value = url.substring(0, lastIndex);
		localStorage.setItem(`${this.prefix}.url`, this.url.value);

		try {
			let data = await this.backend.load(url);
			this.loadDone(data);
		} catch (e) {
			this.error(e);
		}
	}

	protected loadDone(data: string) {
		try {
			let json = MM.Format.JSON.from(data);
			super.loadDone(json);
		} catch (e) {
			this.error(e);
		}
	}
}
