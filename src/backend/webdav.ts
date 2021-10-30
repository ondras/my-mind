import Backend from "./backend.js";


export default class WebDAV extends Backend {
	constructor() { super("webdav"); }

	save(data: string, url: string) {
		return this.request("PUT", url, data);
	}

	load(url: string) {
		return this.request("GET", url);
	}

	async request(method: string, url: string, data?: string) {
		let init: RequestInit = {
			method,
			credentials: "include"
		}
		if (data) { init.body = data; }

		let response = await fetch(url, init);
		let text = await response.text();

		if (response.status == 200) {
			return text;
		} else {
			throw new Error(`HTTP/${response.status}\n\n${text}`);
		}
	}
}
