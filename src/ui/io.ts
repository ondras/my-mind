import * as pubsub from "../pubsub.js";
import { Mode, repo } from "./backend/backend.js";

import Local from "./backend/local.js";
import File from "./backend/file.js";
import WebDAV from "./backend/webdav.js";
import Image from "./backend/image.js";
import GDrive from "./backend/gdrive.js";
import Firebase from "./backend/firebase.js";


let currentMode: Mode = "load";
let currentBackend = null;

const node = document.querySelector<HTMLElement>("#io");
const select = node.querySelector<HTMLSelectElement>("#backend");
const PREFIX = "mm.app";

export function init() {
	[Local, Firebase, GDrive, File, WebDAV, Image].forEach(ctor => {
		let bui = new ctor();
		select.append(bui.option);
	});

	select.value = localStorage.getItem(`${PREFIX}.backend`) || "file";
	select.addEventListener("change", syncBackend);

	pubsub.subscribe("map-new", _ => setCurrentBackend(null));
	pubsub.subscribe("save-done", onDone);
	pubsub.subscribe("load-done", onDone);
}

function onDone(_message: string, publisher?: any) {
	hide();
	setCurrentBackend(publisher);
}

export function restore() {
	let parts: Record<string, string> = {};
	location.search.substring(1).split("&").forEach(item => {
		let keyvalue = item.split("=").map(decodeURIComponent);
		parts[keyvalue[0]] = keyvalue[1];
	});

	// backwards compatibility
	if ("map" in parts) { parts.url = parts.map; }

	// just URL means webdav backend
	if ("url" in parts && !("b" in parts)) { parts.b = "webdav"; }

	let backend = repo.get(parts.b);
	if (backend) { // saved backend info
		backend.setState(parts);
		return;
	}

	if (parts.state) { // opened from gdrive
		try {
			var state = JSON.parse(parts.state);
			if (state.action == "open") {
				state = {
					b: "gdrive",
					id: state.ids[0]
				};
				repo.get("gdrive").setState(state);
			} else {
				history.replaceState(null, "", ".");
			}
			return;
		} catch (e) { }
	}
}

export function show(mode: Mode) {
	currentMode = mode;
	node.hidden = false;
	node.querySelector("h3").textContent = mode;

	syncBackend();
}

export function hide() {
	node.hidden = true;
}

export function quickSave() {
	if (currentBackend) {
		currentBackend.save();
	} else {
		show("save");
	}
}

function syncBackend() {
	[...node.querySelectorAll<HTMLElement>("div[id]")].forEach(node => node.hidden = true);
	node.querySelector<HTMLElement>(`#${select.value}`).hidden = false;
	repo.get(select.value).show(currentMode);
}

function setCurrentBackend(backend) {
	if (currentBackend && currentBackend != backend) { currentBackend.reset(); }

	if (backend) { localStorage.setItem(`${PREFIX}.backend`, backend.id); }
	currentBackend = backend;
	try {
		updateURL(); // fails when on file:///
	} catch (e) {}
}

function updateURL() {
	let data = currentBackend && currentBackend.getState();
	if (!data) {
		history.replaceState(null, "", ".");
	} else {
		let arr = Object.entries(data).map(pair => pair.map(encodeURIComponent).join("="));
		history.replaceState(null, "", "?" + arr.join("&"));
	}
}
