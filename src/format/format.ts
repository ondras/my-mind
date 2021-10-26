export default abstract class Format {
	constructor(readonly id:string) {
		repo.set(id, this);
	}

	abstract to(data): string;
	abstract from(data: string);
}

export let repo = new Map<string, Format>();

MM.Format = Object.create(MM.Repo, {
	extension: {value:""},
	mime: {value:""}
});

function getByProperty(property: string, value: string) {
	let filtered = [...repo.values()].filter(format => format[property] == value);
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
