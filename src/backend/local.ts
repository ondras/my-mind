import Backend from "./backend.js";


export default class Local extends Backend {
	protected prefix = "mm.map";

	constructor() { super("local"); }

	save(data: string, id: string, name: string) {
		localStorage.setItem(`${this.prefix}.${id}`, data);

		let names = this.list();
		names[id] = name;
		localStorage.setItem(`${this.prefix}.names`, JSON.stringify(names));
	}

	load(id: string) {
		let data = localStorage.getItem(`${this.prefix}.${id}`);
		if (!data) { throw new Error("There is no such saved map"); }
		return data;
	}

	remove(id: string) {
		localStorage.removeItem(`${this.prefix}.${id}`);

		let names = this.list();
		delete names[id];
		localStorage.setItem(`${this.prefix}.names`, JSON.stringify(names));
	}

	list() {
		try {
			let data = localStorage.getItem(`${this.prefix}.names`) || "{}";
			return JSON.parse(data);
		} catch (e) {
			return {};
		}
	}
}
