import * as pubsub from "../../pubsub.js";
import * as app from "../../my-mind.js";
import * as io from "../io.js";
import MindMap, { Jsonified } from "../../map.js";
import Backend from "../../backend/backend.js";


export type Mode = "load" | "save";

export default abstract class BackendUI<T extends Backend> {
	protected mode: Mode = "load";
	protected prefix: string;

	constructor(protected backend: T, protected label: string) {
		repo.set(this.id, this);
		this.prefix = `mm.app.${this.id}`; // fixme k cemu?

		const { go, cancel } = this;
		cancel.addEventListener("click", _ => io.hide());
		go.addEventListener("click", _ => this.submit());
	}

	get id() { return this.backend.id; }
	get node() { return document.querySelector(`#${this.id}`)!; }
	get cancel() { return this.node.querySelector<HTMLButtonElement>(".cancel")!; }
	get go() { return this.node.querySelector<HTMLButtonElement>(".go")!; }
	get option() { return new Option(this.label, this.id); }

	abstract save(): void;
	abstract load(): void;

	reset() { this.backend.reset(); }
	setState(_data: unknown) {} // fixme any?
	getState(): unknown { return {}; }

	show(mode: Mode) {
		this.mode = mode;

		const { go, node } = this;

		go.textContent = mode.charAt(0).toUpperCase() + mode.substring(1);

		[...node.querySelectorAll<HTMLElement>("[data-for]")].forEach(node => node.hidden = true);
		[...node.querySelectorAll<HTMLElement>(`[data-for~=${mode}]`)].forEach(node => node.hidden = false);

		go.focus();
	}

	protected saveDone() {
		app.setThrobber(false);
		pubsub.publish("save-done", this);
	}

	protected loadDone(json: Jsonified) {
		app.setThrobber(false);
		try {
			app.showMap(MindMap.fromJSON(json));
			pubsub.publish("load-done", this);
		} catch (e) {
			this.error(e);
		}
	}

	protected error(e: unknown) {
		app.setThrobber(false);
		let message = (e instanceof Error ? e.message : e);
		alert(`IO error: ${message}`);
	}

	protected submit() {
		switch (this.mode) {
			case "save": this.save(); break;
			case "load": this.load(); break;
		}
	}
}

export let repo = new Map<string, BackendUI<Backend>>();

export function buildList(list: Record<string, string>, select: HTMLSelectElement) {
	let data = [];

	for (let id in list) {
		data.push({id:id, name:list[id]});
	}

	data.sort((a, b) => a.name.localeCompare(b.name));

	let options = data.map(item => new Option(item.name, item.id));
	select.append(...options);
}
