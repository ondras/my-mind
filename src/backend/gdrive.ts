import Backend from "./backend.js";
import { repo as formatRepo } from "../format/format.js";


declare const google: any;
declare const gapi: any;

const SCOPE = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.install";
const CLIENT_ID = "767837575056-h87qmlhmhb3djhaaqta5gv2v3koa9hii.apps.googleusercontent.com";
const API_KEY = "AIzaSyCzu1qVxlgufneOYpBgDJXN6Z9SNVcHYWM";

export interface LoadedData {
	name: string;
	data: string;
	mime: string;
}

export default class GDrive extends Backend {
	fileId: string | null = null;

	constructor() { super("gdrive"); }

	reset() {
		this.fileId = null;
	}

	async save(data: string, name: string, mime: string) {
		await connect();
		this.fileId = await this.send(data, name, mime);
	}

	protected send(data: string, name: string, mime: string) {
		var path = "/upload/drive/v2/files";
		var method = "POST";
		if (this.fileId) {
			path += "/" + this.fileId;
			method = "PUT";
		}

		var boundary = "b" + Math.random();
		var delimiter = "--" + boundary;
		var body = [
			delimiter,
			"Content-Type: application/json", "",
			JSON.stringify({title:name}),
			delimiter,
			"Content-Type: " + mime, "",
			data,
			delimiter + "--"
		].join("\r\n");

		var request = gapi.client.request({
			path: path,
			method: method,
			headers: {
				"Content-Type": "multipart/mixed; boundary='" + boundary + "'"
			},
			body: body
		});

		return new Promise<string>((resolve, reject) => {
			request.execute((response:any) => {
				if (!response) {
					reject(new Error("Failed to upload to Google Drive"));
				} else if (response.error) {
					reject(response.error);
				} else {
					resolve(response.id);
				}
			});
		});
	}

	async load(id: string) {
		await connect();
		this.fileId = id;

		var request = gapi.client.request({
			path: "/drive/v2/files/" + this.fileId,
			method: "GET"
		});

		return new Promise<LoadedData>((resolve, reject) => {
			request.execute(async (response:any) => {
				if (!response || !response.id) {
					return reject(response && response.error || new Error("Failed to download file"));
				}

				let headers = {"Authentication": "Bearer " + gapi.auth.getToken().access_token};

				let r = await fetch(`https://www.googleapis.com/drive/v2/files/${response.id}?alt=media`, {headers});
				let data = await r.text();
				if (r.status != 200) { return reject(data); }

				resolve({data, name:response.title, mime:response.mimeType});
			});
		});
	}

	async pick() {
		await connect();

		var token = gapi.auth.getToken();
		var mimeTypes = ["application/json; charset=UTF-8", "application/json"];
		[...formatRepo.values()].forEach(format => {
			if (format.mime) { mimeTypes.unshift(format.mime); }
		});

		var view = new google.picker.DocsView(google.picker.ViewId.DOCS)
			.setMimeTypes(mimeTypes.join(","))
			.setMode(google.picker.DocsViewMode.LIST);

		return new Promise<string | null>(resolve => {
			let picker = new google.picker.PickerBuilder()
				.enableFeature(google.picker.Feature.NAV_HIDDEN)
				.addView(view)
				.setOAuthToken(token.access_token)
				.setDeveloperKey(API_KEY)
				.setCallback((data:any) => {
					switch (data[google.picker.Response.ACTION]) {
						case google.picker.Action.PICKED:
							var doc = data[google.picker.Response.DOCUMENTS][0];
							resolve(doc.id);
						break;

						case google.picker.Action.CANCEL:
							resolve(null);
						break;
					}
				})
				.build();
			picker.setVisible(true);
		});
	}
}

async function connect() {
	if ("gapi" in window && gapi.auth.getToken()) {
		return;
	} else {
		await loadGapi();
		return auth();
	}
}

function loadGapi() {
	if ("gapi" in window) { return; }

	let script = document.createElement("script");
	let name = ("cb"+Math.random()).replace(".", "");
	script.src = "https://apis.google.com/js/client:picker.js?onload=" + name;
	document.body.append(script);

	return new Promise(resolve => (window as any)[name] = resolve);
}

async function auth(forceUI = false) {
	return new Promise<void>((resolve, reject) => {
		gapi.auth.authorize({
			"client_id": CLIENT_ID,
			"scope": SCOPE,
			"immediate": !forceUI
		}, async (token:any) => {
			if (token && !token.error) { // done
				resolve();
			} else if (!forceUI) { // try again with ui
				try {
					await auth(true);
					resolve();
				} catch (e) { reject(e); }
			} else { // bad luck
				reject(token && token.error || new Error("Failed to authorize with Google"));
			}
		});
	});
}
