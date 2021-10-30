import { Jsonified as JsonifiedMap } from "../map.js";
import { Jsonified as JsonifiedItem } from "../item.js";


export default abstract class Format {
	extension?: string;
	mime?: string;

	constructor(readonly id:string, readonly label:string) {
		repo.set(id, this);
	}

	abstract to(data: JsonifiedMap | JsonifiedItem): string;
	abstract from(data: string): JsonifiedMap;

	get option() { return new Option(this.label, this.id); }
}

export let repo = new Map<string, Format>();

function getByProperty(property: string, value: string) {
	type FormatProp = keyof Format;

	let filtered = [...repo.values()].filter(format => format[property as FormatProp] == value);
	return (filtered[0] || null);
}

export function getByName(name: string) {
	let index = name.lastIndexOf(".");
	if (index == -1) { return null; }
	let extension = name.substring(index+1).toLowerCase();
	return getByProperty("extension", extension);
}

export function getByMime(mime: string) {
	return getByProperty("mime", mime);
}

export function nl2br(str: string) {
	return str.replace(/\n/g, "<br/>");
}

export function br2nl(str: string) {
	return str.replace(/<br\s*\/?>/g, "\n");
}
