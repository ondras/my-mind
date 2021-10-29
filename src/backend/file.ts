import Backend from "./backend.js";


export interface LoadedData {
	name: string;
	data: string;
}

export default class File extends Backend {
	input = document.createElement("input");

	constructor() { super("file"); }

	save(data: string, name: string) {
		let link = document.createElement("a");
		link.download = name;
		link.href = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(data)));
		document.body.append(link);
		link.click();
		link.remove();
	}

	load() {
		const { input } = this;
		input.type = "file";

		return new Promise<LoadedData>((resolve, reject) => {
			input.onchange = _ => {
				let file = input.files![0];
				if (!file) { return; }

				var reader = new FileReader();
				reader.onload = function() { resolve({data:reader.result as string, name:file.name}); }
				reader.onerror = function() { reject(reader.error); }
				reader.readAsText(file);
			};

			input.click();
		});
	}
}
