import Format from "./format.js";
import { Jsonified } from "../map.js";


export default class Native extends Format {
	extension = "mymind";
	mime = "application/vnd.mymind+json";

	constructor() { super("native", "Native (JSON)"); }

	to(data: Jsonified) {
		return JSON.stringify(data, null, "\t") + "\n";
	}

	from(data: string): Jsonified {
		return JSON.parse(data);
	}
}
